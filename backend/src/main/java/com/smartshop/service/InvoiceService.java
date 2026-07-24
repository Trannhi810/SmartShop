package com.smartshop.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.smartshop.entity.order.Order;
import com.smartshop.entity.order.OrderItem;
import com.smartshop.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class InvoiceService {

    private final OrderRepository orderRepository;

    public InvoiceService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Tạo hóa đơn PDF đơn giản cho 1 order
    public byte[] generateInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Header
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
            Paragraph title = new Paragraph("HÓA ĐƠN THANH TOÁN", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Mã đơn hàng: " + order.getOrderNumber()));
            document.add(new Paragraph("Khách hàng: " + (order.getUser() != null ? order.getUser().getFullName() : "N/A")));
            document.add(new Paragraph("Ngày tạo: " + order.getCreatedAt()));
            document.add(new Paragraph("Địa chỉ giao hàng:"));
            document.add(new Paragraph(order.getShippingAddress() != null ? order.getShippingAddress() : ""));

            document.add(new Paragraph(" "));

            // Bảng sản phẩm
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4, 1.5f, 1, 2});

            addHeaderCell(table, "Sản phẩm");
            addHeaderCell(table, "Đơn giá");
            addHeaderCell(table, "SL");
            addHeaderCell(table, "Thành tiền");

            double total = 0.0;
            for (OrderItem item : order.getItems()) {
                double line = item.getPrice() * item.getQuantity();
                total += line;

                addCell(table, item.getProduct() != null ? item.getProduct().getName() : "N/A");
                addCell(table, formatVnd(item.getPrice()));
                addCell(table, String.valueOf(item.getQuantity()));
                addCell(table, formatVnd(line));
            }

            document.add(table);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Tổng tiền: " + formatVnd(total)));
            document.add(new Paragraph("Trạng thái thanh toán: " + order.getPaymentStatus()));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate invoice PDF", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text) {
        Font font = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text));
        table.addCell(cell);
    }

    private String formatVnd(double amount) {
        return String.format("%,.0f VND", amount);
    }
}


