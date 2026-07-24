import { test, expect } from '@playwright/test';

test('Đăng nhập với tài khoản admin và đăng xuất', async ({ page }) => {
  // Truy cập trang chủ
  await page.goto('http://localhost:8080/');

  // Chụp ảnh trang chủ để debug
  await page.screenshot({ path: 'debug-01-homepage.png' });

  // Click vào link Đăng nhập
  await page.getByRole('link', { name: 'Đăng nhập' }).click();
  await page.screenshot({ path: 'debug-02-login-page.png' });

  // Điền thông tin đăng nhập
  await page.getByRole('textbox', { name: 'Email' }).fill('admin123@gmail.com');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('Password@123');
  await page.screenshot({ path: 'debug-03-filled-form.png' });

  // Click submit
  await page.locator('#submitButton').click();

  // Chờ 5 giây và chụp ảnh để xem kết quả đăng nhập
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'debug-04-after-login.png' });

  // In ra URL hiện tại để debug
  console.log('Current URL after login:', page.url());
  console.log('Page title:', await page.title());

  // Kiểm tra đăng nhập thành công: nút "admin Quản trị" phải xuất hiện
  await expect(page.getByRole('button', { name: 'admin Quản trị' })).toBeVisible({ timeout: 10000 });

  // Mở menu người dùng
  await page.locator('#userMenuChip').click();

  // Bấm Đăng xuất
  await page.getByRole('button', { name: 'Đăng xuất' }).click();

  // Kiểm tra đã đăng xuất thành công
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
});