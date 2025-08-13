import { Request, Response, NextFunction } from "express";
import Cart from "../models/cart.model";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { AuthenticatedRequest } from "../middlewares/admin.middleware";
import axios from "axios";

export const addToCart = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { variantId, quantity } = req.body;
    const userId = req.user?.userId;

    if (!variantId || !quantity || !userId) {
      return next(new AppError("All fields are required", 400));
    }

    // Fetch variant data from inventory-service
    const variantRes: any = await axios.get(
      `${process.env.INVENTORY_SERVICE_URL}/api/variants/${variantId}`
    );
    const variant = variantRes.data?.variant;

    if (!variant || !variant.isActive) {
      return next(new AppError("Variant not found", 404));
    }

    // check stock
    if (variant.stock < quantity) {
      return next(new AppError("Insufficient stock", 400));
    }

    // price
    const finalPrice =
      variant.discountPrice > 0 ? variant.discountPrice : variant.price;

    // find existing cart
    let cart = await Cart.findOne({ userId, status: "active" });

    if (!cart) {
      // create new cart
      cart = new Cart({
        userId,
        items: [
          {
            productId: variant.productId,
            variantId,
            quantity,
            price: finalPrice,
            totalPrice: finalPrice * quantity,
          },
        ],
      });
    } else {
      // check if item already in cart
      const existingItem = cart.items.find(
        (item) => item.variantId.toString() === variantId
      );

      if (existingItem) {
        // update quantity
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > variant.stock) {
          return next(new AppError("Insufficient stock", 400));
        }

        // update quantity
        existingItem.quantity = newQuantity;
        existingItem.price = finalPrice;
        existingItem.totalPrice = finalPrice * newQuantity;
      } else {
        // add new item
        cart.items.push({
          productId: variant.productId,
          variantId: variant._id,
          quantity,
          price: finalPrice,
          totalPrice: finalPrice * quantity,
        });
      }
    }

    await cart.save();

    res.status(200).json({
      status: "success",
      message: "Item added to cart successfully",
      cart,
    });
  }
);

export const getCartData = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError("User not found", 404));
    }

    const cart = await Cart.findOne({ userId, status: "active" }).lean();

    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    // collect productIds and variantIds
    const productIds = cart.items.map((item) => String(item.productId));
    const variantIds = cart.items.map((item) => String(item.variantId));

    // fetch product data from product-service
    const productRes: any = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/all-by-product-ids`,
      {
        params: {
          productIds: productIds.join(","),
        },
      }
    );
    const productsMap = new Map(
      productRes.data.products.map((product: any) => [
        product._id.toString(),
        product,
      ])
    );

    // fetch variant data from inventory-service
    const variantRes: any = await axios.get(
      `${process.env.INVENTORY_SERVICE_URL}/api/variants/all-by-variant-ids`,
      { params: { variantIds: variantIds.join(",") } }
    );
    const variantsMap = new Map(
      variantRes.data.variants.map((variant: any) => [
        variant._id.toString(),
        variant,
      ])
    );

    // merge data
    const cartData = cart.items.map((item) => {
      const product = productsMap.get(item.productId.toString()) as any;
      const variant = variantsMap.get(item.variantId.toString()) as any;

      return {
        ...item,
        product: {
          _id: product?._id,
          name: product?.name,
          images: product?.images,
          isActive: variant?.isActive,
          gender: product?.gender,
          collection: product?.collectionId,
        },
        variant: {
          _id: variant?._id,
          size: variant?.size,
          price: variant?.price,
          discountPrice: variant?.discountPrice,
          stock: variant?.stock,
        },
        currentPrice:
          variant?.discountPrice > 0 ? variant?.discountPrice : variant?.price,
        originalPrice: variant?.price || 0,
      };
    });

    // ✅ Pricing calculations
    const subtotal = cartData.reduce(
      (sum, item) => sum + (item.originalPrice || 0) * (item.quantity || 1),
      0
    );

    const totalFinalPrice = cartData.reduce(
      (sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1),
      0
    );

    const totalDiscount = subtotal - totalFinalPrice;

    const grandTotal = totalFinalPrice; // Can add tax/shipping here later

    console.log("cartData : ", cartData);
    console.log("totalFinalPrice : ", totalFinalPrice);

    res.status(200).json({
      status: "success",
      message: "Cart fetched successfully",
      cart: {
        ...cart,
        items: cartData,
        subtotal,
        totalDiscount,
        totalFinalPrice,
        grandTotal,
      },
    });
  }
);
