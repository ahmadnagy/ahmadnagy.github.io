export const MODEL='Xenova/clip-vit-base-patch32';
export const LABELS={Bags:'a handbag, purse, tote bag or backpack',Shoes:'shoes, sneakers, sandals or boots',Dresses:'a dress',Skirts:'a skirt',Tops:'a shirt, blouse or t-shirt',Pants:'trousers or pants',Shorts:'shorts',Jeans:'denim jeans',Swimwear:'a swimsuit or bikini',Activewear:'sportswear, yoga clothing or leggings','Jackets & coats':'a jacket, coat or blazer',Knitwear:'a sweater or cardigan',Abayas:'an abaya or long robe',Underwear:'underwear, lingerie or a bra',Accessories:'jewelry, a watch, belt, scarf or sunglasses',Perfume:'a perfume or fragrance bottle',Other:'electronics, furniture, food, toys or household products'};
export function verdict(scores,image){const sorted=Object.entries(scores).sort((a,b)=>b[1]-a[1]);return{image,category:sorted[0][0],score:sorted[0][1],margin:sorted[0][1]-(sorted[1]?.[1]||0),scores,checkedAt:Date.now()};}
export function visualCategoryMatches(product,category,index){
 if(!category||category==='All')return true;
 const wanted=category==='Bikinis'?'Swimwear':category;
 if(!LABELS[wanted])return true;
 const row=index?.items?.[product.productURL||product.id];
 if(!row||row.image!==product.imageURLs?.[0]||!Number.isFinite(row.score)||!Number.isFinite(row.margin)||!Number.isFinite(row.scores?.[wanted]))return true;
 // Related clothing categories and outfits are ambiguous. Only reject clear,
 // unrelated dominant products; scores are relative rankings, not probabilities.
 const apparel=new Set(['Dresses','Skirts','Tops','Pants','Shorts','Jeans','Swimwear','Activewear','Jackets & coats','Knitwear','Abayas','Underwear']);
 if(row.category===wanted||apparel.has(wanted)&&apparel.has(row.category))return true;
 return !(row.score>=0.85&&row.margin>=0.50&&row.scores[wanted]<0.04);
}
