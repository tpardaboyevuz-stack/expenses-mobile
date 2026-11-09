# Hamyon — shaxsiy xarajatlar

Android / iOS uchun Expo va React Native ilovasi. Alohida loyiha; yuqoridagi Vue dashboarddan mustaqil.

## Ishga tushirish

Node.js 22.13+ (LTS) kerak.

```sh
cd expenses-mobile
npm install
npm start
```

Telefonga mos Expo Go versiyasini o‘rnating, kompyuter bilan bitta Wi-Fi tarmog‘iga ulang va terminaldagi QR kodni skanerlang. Ushbu loyiha Expo SDK 58 ishlatadi; Expo Go shu SDK’ni qo‘llashi kerak. Simulator uchun `npm run ios` (Xcode) yoki `npm run android` (Android Studio) ishlating.

Kompyuterdagi Node 20 bilan vaqtincha ishga tushirish:

```sh
npx --yes --package=node@22 node node_modules/expo/bin/cli start
```

## Imkoniyatlar

- Xarajat: butun so‘m, kategoriya, sana, ixtiyoriy izoh.
- Bugungi va oxirgi 7 kunlik jami, kunlik o‘rtacha, oldingi davr bilan taqqoslash.
- Haftalik ustunli grafik va kategoriyalar ulushi.
- Tarix, kategoriya filtri, tahrirlash va tasdiqlab o‘chirish.
- Qurilmada AsyncStorage orqali saqlash; internet talab qilinmaydi.
- Bo‘sh holat va saqlash xatolari uchun ko‘rsatmalar.

“7 kun” bugun va oldingi 6 kunni anglatadi. Sana qurilmaning mahalliy vaqtida olinadi. Demo xarajatlar kiritilmagan.

Ma’lumotlar hisobga yoki bulutga ulanmagan. Qurilma almashtirilganda sinxronlanmaydi; ilova ma’lumotlari tozalansa yoki ilova o‘chirilsa yo‘qolishi mumkin. Saqlash shifrlanmagan. Eksport va backup keyingi bosqichga qolgan.

## Tekshirish

```sh
npm test
npx expo export --platform ios --output-dir dist-ios
npx expo export --platform android --output-dir dist-android
```

Store uchun paket chiqarish va Apple/Google akkauntlari bilan nashr qilish alohida bosqich. Hozirgi ilova lokal MVP hisoblanadi.
