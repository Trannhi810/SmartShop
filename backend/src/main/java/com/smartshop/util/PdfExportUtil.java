package com.smartshop.util;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Utility class for PDF export operations using iText
 */
public class PdfExportUtil {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter DATE_ONLY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Colors
    private static final BaseColor HEADER_BG_COLOR = new BaseColor(66, 139, 202);
    private static final BaseColor HEADER_TEXT_COLOR = BaseColor.WHITE;
    private static final BaseColor ALTERNATE_ROW_COLOR = new BaseColor(245, 245, 245);

    /**
     * Creates a PDF document with a table
     * 
     * @param title Title of the document
     * @param headers Array of column headers
     * @param data List of rows, where each row is a Map with header keys and values
     * @return ByteArrayOutputStream containing the PDF file
     * @throws DocumentException if there's an error creating the document
     */
    public static ByteArrayOutputStream createPdfFile(String title, String[] headers, List<Map<String, Object>> data) throws DocumentException {
        Document document = new Document(PageSize.A4.rotate()); // Landscape orientation
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // Add title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.BLACK);
            Paragraph titleParagraph = new Paragraph(title, titleFont);
            titleParagraph.setAlignment(Element.ALIGN_CENTER);
            titleParagraph.setSpacingAfter(10);
            document.add(titleParagraph);

            // Add export date
            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
            Paragraph dateParagraph = new Paragraph(
                "Ngày xuất: " + LocalDateTime.now().format(DATE_ONLY_FORMATTER),
                dateFont
            );
            dateParagraph.setAlignment(Element.ALIGN_CENTER);
            dateParagraph.setSpacingAfter(15);
            document.add(dateParagraph);

            // Create table
            PdfPTable table = new PdfPTable(headers.length);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            // Set column widths (equal width for all columns)
            float[] columnWidths = new float[headers.length];
            for (int i = 0; i < headers.length; i++) {
                columnWidths[i] = 100f / headers.length;
            }
            table.setWidths(columnWidths);

            // Add header row
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, HEADER_TEXT_COLOR);
            for (String header : headers) {
                PdfPCell headerCell = new PdfPCell(new Phrase(header, headerFont));
                headerCell.setBackgroundColor(HEADER_BG_COLOR);
                headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                headerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                headerCell.setPadding(5);
                table.addCell(headerCell);
            }

            // Add data rows
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 7, BaseColor.BLACK);
            int rowIndex = 0;
            for (Map<String, Object> rowData : data) {
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(formatValue(rowData.get(header)), dataFont));
                    cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                    cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cell.setPadding(4);
                    
                    // Alternate row background color
                    if (rowIndex % 2 == 1) {
                        cell.setBackgroundColor(ALTERNATE_ROW_COLOR);
                    }
                    
                    table.addCell(cell);
                }
                rowIndex++;
            }

            document.add(table);
            document.close();

        } catch (DocumentException e) {
            if (document.isOpen()) {
                document.close();
            }
            throw e;
        }

        return outputStream;
    }

    /**
     * Formats a value to string for PDF display
     */
    private static String formatValue(Object value) {
        if (value == null) {
            return "-";
        } else if (value instanceof LocalDateTime) {
            return ((LocalDateTime) value).format(DATE_FORMATTER);
        } else if (value instanceof Number) {
            return value.toString();
        } else if (value instanceof Boolean) {
            return ((Boolean) value) ? "Có" : "Không";
        } else {
            String str = value.toString();
            // Truncate long strings to fit in PDF cells
            return str.length() > 50 ? str.substring(0, 47) + "..." : str;
        }
    }

    /**
     * Formats LocalDateTime to string
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DATE_FORMATTER);
    }

    /**
     * Formats LocalDateTime to date-only string
     */
    public static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DATE_ONLY_FORMATTER);
    }
}

