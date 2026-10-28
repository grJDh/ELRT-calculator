/* Positions digitized from the user-supplied 7680 × 4837 reference.
 * Coordinates below use a half-size reference; divide by 3.2 for the atlas.
 * Reference additions are conservatively Custom, not assertions of non-canonicity.
 * Added route mileage = printed diagram hours × its stated 30 mph.
 */
window.RAIL_ATLAS = {
  positions: {
    "Sharn":[870,2160], "First Tower":[898,2135], "Wroat":[1068,1916],
    "Hatheril":[1484,1671], "Sword Keep":[1482,1552], "Marketplace":[1456,1476],
    "Passage":[1335,1257], "Fairhaven":[1506,1085], "Thaliost":[1973,867],
    "Rekkenmark":[2019,867], "Korth":[2216,1013], "Atur":[2360,1062],
    "Vedykar":[2460,1184], "Fort Zombie":[2411,1330], "Vulyar":[2580,1306],
    "Irontown":[2858,1075], "Krona Peak":[2908,1023], "Gatherhold":[2531,1575],
    "Flamekeep":[1898,1257], "Sigilstar":[1725,1402], "Aruldusk":[1945,1429],
    "Vathirond":[1995,1575], "Starilaskur":[1654,1673], "Sterngate":[1554,1916],
    "Zolanberg":[1555,2110], "Korranberg":[1565,2303]
  },
  towns: [
    ["Arcanix",1264,1355,"Aundair"],["Xandrar",1060,1407,"Breland"],
    ["Latheer",1530,1187,"Aundair"],["Danthaven",1675,1232,"Thrane"],
    ["Daskaran",1701,1061,"Thrane"],["Athandra",1630,1307,"Thrane"],
    ["Avaroth",1703,1332,"Thrane"],["Sharavacion",1785,1360,"Thrane"],
    ["Tellyn",1579,1409,"Thrane"],["Nowhere",1497,1734,"Breland"],
    ["New Cyre",1776,1745,"Breland"],["Threshold",869,1633,"Breland"],
    ["Ardev",945,1769,"Breland"],["Galethspyre",980,1896,"Breland"],
    ["Bastion",2482,1014,"Karrnath"],["Sharpton",2546,974,"Karrnath"],
    ["Eiben",2599,935,"Karrnath"],["Teryk",2579,1110,"Karrnath"],
    ["Karrlakton",2335,1258,"Karrnath"],["Soldit",2440,1289,"Karrnath"],
    ["Vom",2647,1255,"Talenta Plains"]
  ],
  routes: [
    ["Arcanix","Passage",5],["Arcanix","Xandrar",7],["Arcanix","Marketplace",9],
    ["Fairhaven","Latheer",3],["Passage","Latheer",7],["Latheer","Danthaven",6],
    ["Danthaven","Daskaran",6],["Danthaven","Flamekeep",8],["Danthaven","Athandra",3],
    ["Athandra","Avaroth",3],["Avaroth","Sharavacion",3],["Sharavacion","Flamekeep",6],
    ["Sharavacion","Sigilstar",3],["Avaroth","Sigilstar",3],["Athandra","Tellyn",4],
    ["Tellyn","Sigilstar",5],["Marketplace","Tellyn",5],["Marketplace","Hatheril",7],
    ["Hatheril","Nowhere",2],["Nowhere","Wroat",16],["Nowhere","Starilaskur",6],
    ["Starilaskur","New Cyre",5],["New Cyre","Vathirond",9],
    ["Wroat","Galethspyre",6],["Galethspyre","Ardev",5],["Ardev","Threshold",6],
    ["Atur","Bastion",5],["Bastion","Sharpton",3],["Sharpton","Eiben",3],
    ["Bastion","Teryk",5],["Vedykar","Karrlakton",5],["Vedykar","Soldit",4],
    ["Soldit","Gatherhold",12],["Vulyar","Vom",3],["Vom","Krona Peak",12]
  ]
};
