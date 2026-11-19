# Hướng dẫn bổ sung asset

Website dùng sẵn placeholder SVG và các ảnh có sẵn trong thư mục `hoa/`, nên không có ảnh nào bị vỡ. Khi bạn có ảnh thật, chỉ cần thay đường dẫn tại **một nơi duy nhất**: `js/assets.js`.

## 1. Cành phượng (Giai đoạn 1)

- Đặt ảnh của bạn vào: `assets/branch/phuong-branch.png`
- Trong `js/assets.js`, sửa dòng:

```js
branch: {
  src: "assets/branch/phuong-branch.svg",  // -> "assets/branch/phuong-branch.png"
  ...
}
```

Placeholder hiện tại: `assets/branch/phuong-branch.svg`.
Vị trí hiển thị: góc trên bên trái, do CSS `.branch-wrap` trong `style.css` điều khiển (`width: clamp(290px, 46vw, 660px)`), có responsive riêng cho tablet/mobile. Ảnh luôn giữ tỉ lệ nhờ `object-fit: contain`.

## 2. Hoa cho màn hình "Ngàn bông hoa" (Giai đoạn 2)

- Đặt ảnh PNG/WebP nền trong suốt vào: `assets/flowers/`
- Thêm hoặc thay phần tử trong mảng `ASSETS.flowers` trong `js/assets.js`:

```js
{ src: "assets/flowers/ten-hoa-moi.png", tone: "crimson", fallback: fallbackFlower }
```

Mỗi bông hoa trong màn hình là một phần tử DOM riêng, kích thước/độ nghiêng/lớp (hậu - trung - tiền cảnh) được tạo ngẫu nhiên trong `js/flowers.js`.

## 3. Cánh hoa rơi (Giai đoạn 1 & 5)

- Thay `assets/flowers/phuong-petal.svg` bằng PNG/WebP cánh hoa của bạn và cập nhật `ASSETS.petal.src` trong `js/assets.js`.
- Màu cánh hoa canvas nằm ở `ASSETS.petals` trong cùng file.

## 4. Nhạc nền (chuẩn bị sẵn, chưa bật)

- Đặt file nhạc vào `assets/audio/nhac-nen.mp3` (tự tạo thư mục này khi bạn có file).
- Trong `js/audio.js`, gán:

```js
AUDIO_CONFIG.src = "assets/audio/nhac-nen.mp3";
```

hoặc gọi `setAudioSource("assets/audio/nhac-nen.mp3")` từ `js/main.js`.
Không có nút bật/tắt nhạc. Trình duyệt chặn autoplay nên nhạc chỉ bắt đầu sau tương tác đầu tiên của người dùng (pointerdown/keydown), sau đó fade-in dần.

## 5. Lưu ý

- Luôn dùng ảnh nền trong suốt (PNG/WebP) cho hoa và cánh hoa.
- Giữ nguyên tên biến/`src` nếu không muốn sửa nhiều chỗ.
- Sau khi thêm asset, chạy `npm run build` để kiểm tra tham chiếu.
