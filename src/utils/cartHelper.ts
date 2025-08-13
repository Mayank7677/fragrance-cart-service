// src/utils/cartHelpers.ts
import axios from "axios";
import { ICartDocument } from "../schemas/cart.schema";

export const enrichCartData = async (cart: ICartDocument) => {
  if (!cart) return null;

  const productIds = cart.items.map((item) => String(item.productId));
  const variantIds = cart.items.map((item) => String(item.variantId));

  // Fetch products
  const productRes: any = await axios.get(
    `${process.env.PRODUCT_SERVICE_URL}/api/products/all-by-product-ids`,
    { params: { productIds: productIds.join(",") } }
  );
  const productsMap = new Map(
    productRes.data.products.map((product: any) => [
      product._id.toString(),
      product,
    ])
  );

  // Fetch variants
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

  // Merge data
  const cartData = cart.items.map((item : any) => {
    const product = productsMap.get(item.productId.toString()) as any;
    const variant = variantsMap.get(item.variantId.toString()) as any;

    return {
      ...item.toObject?.() || item, 
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

  // Pricing calculations
  const subtotal = cartData.reduce(
    (sum, item) => sum + (item.originalPrice || 0) * (item.quantity || 1),
    0
  );
  const totalFinalPrice = cartData.reduce(
    (sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1),
    0
  );
  const totalDiscount = subtotal - totalFinalPrice;
  const grandTotal = totalFinalPrice;

  return {
    ...(cart.toObject?.() || cart),
    items: cartData,
    subtotal,
    totalDiscount,
    totalFinalPrice,
    grandTotal,
  };
};
