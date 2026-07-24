import { test, expect } from '@playwright/test';

test('Đăng nhập với tài khoản admin và đăng xuất', async ({ page }) => {
  // Truy cập trang chủ
  await page.goto('http://localhost:8080/');

  // Click vào link Đăng nhập
  await page.getByRole('link', { name: 'Đăng nhập' }).click();

  // Điền thông tin đăng nhập
  await page.getByRole('textbox', { name: 'Email' }).fill('admin123@gmail.com');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('admin123@gmail.com');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

  // Kiểm tra đăng nhập thành công: nút "admin Quản trị" phải xuất hiện
  await expect(page.getByRole('button', { name: 'admin Quản trị' })).toBeVisible({ timeout: 10000 });

  // Mở menu người dùng
  await page.locator('#userMenuChip').click();

  // Bấm Đăng xuất
  await page.getByRole('button', { name: 'Đăng xuất' }).click();

  // Kiểm tra đã đăng xuất thành công: link Đăng nhập phải xuất hiện trở lại
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
});