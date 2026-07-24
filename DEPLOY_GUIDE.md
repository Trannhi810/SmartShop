# Hướng dẫn Deploy dự án lên Render & Aiven

Dự án này đã được tự động hóa CI/CD thông qua GitHub Actions (`.github/workflows/ci-cd.yml`).
Mỗi khi bạn `push` code lên nhánh `main`, hệ thống sẽ tự động Build, chạy Test (bao gồm Playwright) và sau cùng là kích hoạt Deploy lên Render.

Để quá trình Deploy (Job 3) hoạt động trơn tru, bạn cần thực hiện các bước cấu hình sau:

---

## 1. Cấu hình Database miễn phí trên Aiven (MySQL)

1. Truy cập [Aiven.io](https://aiven.io/) và tạo tài khoản.
2. Tạo một Service mới, chọn **MySQL**, chọn gói **Free** (Miễn phí).
3. Đợi vài phút để Database khởi tạo. Sau khi xong, bạn sẽ thấy các thông tin kết nối (Service URI).
4. Bạn sẽ cần lấy các thông số sau để điền vào Render:
   - **Host**
   - **Port** (thường là 25060 hoặc tương tự)
   - **User** (thường là `avnadmin`)
   - **Password**
   - Tên database mặc định là `defaultdb`.

---

## 2. Cấu hình Web Service trên Render

1. Truy cập [Render.com](https://render.com/) và đăng nhập bằng GitHub.
2. Bấm **New** -> **Web Service**.
3. Chọn repo GitHub của dự án (ví dụ: `smartshop`).
4. Trong phần cài đặt Web Service:
   - **Name**: `smartshop`
   - **Region**: Chọn vùng gần nhất (vd: Singapore).
   - **Branch**: `main`
   - **Environment**: Chọn `Docker` (Render sẽ tự động dùng file `Dockerfile` đã tạo sẵn trong dự án).
   - **Plan**: Free
5. Cuộn xuống phần **Environment Variables** (Biến môi trường) và thêm 3 biến sau (lấy từ Aiven):
   - `DB_URL` : `jdbc:mysql://<Aiven-Host>:<Aiven-Port>/defaultdb?createDatabaseIfNotExist=true&useSSL=true`
   - `DB_USERNAME` : `<Aiven-User>`
   - `DB_PASSWORD` : `<Aiven-Password>`
6. Bấm **Create Web Service** và chờ Render build lần đầu. 
   *(Lưu ý: Lần đầu build có thể mất 5-10 phút)*.

---

## 3. Cấu hình Auto-Deploy từ GitHub Actions (CI/CD)

Để GitHub Actions có thể tự động "nhắc" Render deploy mỗi khi có code mới (sau khi test xong):

1. Trên màn hình quản lý Web Service của Render, chọn tab **Settings**.
2. Tìm đến mục **Deploy Hook**.
3. Copy đường link URL của Deploy Hook (bắt đầu bằng `https://api.render.com/deploy/srv-...`).
4. Quay lại repo của bạn trên **GitHub**.
5. Vào **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
6. Đặt tên (Name): `RENDER_DEPLOY_HOOK`
7. Value: Dán đường link URL vừa copy ở bước 3.
8. Bấm **Add secret**.

🎉 **Hoàn tất!**
Từ nay, mỗi khi bạn đẩy code lên GitHub, thẻ **Actions** sẽ chạy:
- Chạy `Build & Unit Test`.
- Chạy `Playwright E2E Tests`.
- Chạy `Deploy to Render` (gọi đường link webhook để Render tự động kéo code mới nhất về và chạy).
