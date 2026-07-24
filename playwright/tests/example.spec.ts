import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  await page.locator('section').filter({ hasText: 'Ưu đãi mùa lễ hội Khám phá th' }).click();
  await page.getByRole('link', { name: 'Đăng nhập' }).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('admin123@gmail.com');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).click();
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('admin123@gmail.com');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.getByRole('button', { name: 'admin Quản trị' }).click();
  await page.locator('#userMenuChip').click();
  await page.locator('#userMenu').getByText('admin Quản trị').click();
  await page.locator('#userMenu').getByText('admin Quản trị').click();
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
});