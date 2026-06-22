package com.pcperformancelab.sensor.importer;

import com.pcperformancelab.sensor.dto.SensorSummaryData;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class HwInfoCsvImportService {

    public SensorSummaryData parse(MultipartFile file) {
        try (
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1)
                );
                CSVParser csvParser = CSVFormat.DEFAULT.builder()
                        .setTrim(true)
                        .setIgnoreSurroundingSpaces(true)
                        .build()
                        .parse(reader)
        ) {
            List<CSVRecord> allRecords = csvParser.getRecords();

            if (allRecords.isEmpty()) {
                throw new IllegalArgumentException("HWiNFO CSV file is empty.");
            }

            CSVRecord headerRecord = allRecords.get(0);
            Map<String, List<Integer>> columnIndexesByName = buildColumnIndex(headerRecord);
            List<CSVRecord> dataRecords = allRecords.subList(1, allRecords.size());

            return new SensorSummaryData(
                    dataRecords.size(),

                    averageInRange(dataRecords, columnIndexesByName, -20, 130, "CPU Package [°C]"),
                    maxInRange(dataRecords, columnIndexesByName, -20, 130, "CPU Package [°C]"),
                    maxInRange(dataRecords, columnIndexesByName, -20, 130, "Core Max [°C]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 400, "CPU Package Power [W]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 400, "CPU Package Power [W]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 100, "Total CPU Usage [%]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 100, "Physical Memory Load [%]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 100, "Physical Memory Load [%]"),

                    averageInRange(dataRecords, columnIndexesByName, -20, 130, "GPU Temperature [°C]"),
                    maxInRange(dataRecords, columnIndexesByName, -20, 130, "GPU Temperature [°C]"),

                    averageInRange(dataRecords, columnIndexesByName, -20, 140, "GPU Hot Spot Temperature [°C]"),
                    maxInRange(dataRecords, columnIndexesByName, -20, 140, "GPU Hot Spot Temperature [°C]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 700, "GPU Power [W]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 700, "GPU Power [W]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 4000, "GPU Clock [MHz]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 4000, "GPU Clock [MHz]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 12000, "GPU Memory Clock [MHz]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 100, "GPU Core Load [%]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 100, "GPU Core Load [%]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 100, "GPU Memory Usage [%]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 100, "GPU Memory Usage [%]"),

                    averageInRange(dataRecords, columnIndexesByName, -20, 130, "GPU Memory Junction Temperature [°C]"),
                    maxInRange(dataRecords, columnIndexesByName, -20, 130, "GPU Memory Junction Temperature [°C]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 4000, "GPU Effective Clock [MHz]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 4000, "GPU Effective Clock [MHz]"),

                    averageInRange(dataRecords, columnIndexesByName, 0, 6000, "Average Effective Clock [MHz]"),
                    maxInRange(dataRecords, columnIndexesByName, 0, 6000, "Average Effective Clock [MHz]"),

                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Core Thermal Throttling (avg) [Yes/No]",
                            "Package/Ring Thermal Throttling [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Core Power Limit Exceeded (avg) [Yes/No]",
                            "Package/Ring Power Limit Exceeded [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "IA Limit Reasons (avg) [Yes/No]"
                    ),

                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "GPU Performance Limiters (avg) [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Performance Limit - Power [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Performance Limit - Thermal [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Performance Limit - Reliability Voltage [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Performance Limit - Max Operating Voltage [Yes/No]"
                    ),
                    anyYes(
                            dataRecords,
                            columnIndexesByName,
                            "Performance Limit - Utilization [Yes/No]"
                    )
            );
        } catch (IOException exception) {
            throw new IllegalArgumentException("Could not read HWiNFO CSV file.", exception);
        }
    }

    private Map<String, List<Integer>> buildColumnIndex(CSVRecord headerRecord) {
        Map<String, List<Integer>> columnIndexesByName = new LinkedHashMap<>();

        for (int index = 0; index < headerRecord.size(); index++) {
            String rawHeader = headerRecord.get(index);

            if (rawHeader == null) {
                continue;
            }

            String header = rawHeader
                    .trim()
                    .replace("\uFEFF", "")
                    .replace("\"", "");

            if (header.isBlank()) {
                continue;
            }

            columnIndexesByName
                    .computeIfAbsent(header, ignored -> new ArrayList<>())
                    .add(index);
        }

        return columnIndexesByName;
    }

    private Double averageInRange(
            List<CSVRecord> records,
            Map<String, List<Integer>> columnIndexesByName,
            double min,
            double max,
            String... columnNames
    ) {
        double sum = 0.0;
        int count = 0;

        for (CSVRecord record : records) {
            Double value = readNumber(record, columnIndexesByName, columnNames);

            if (!isInRange(value, min, max)) {
                continue;
            }

            sum += value;
            count++;
        }

        return count == 0 ? null : sum / count;
    }

    private Double maxInRange(
            List<CSVRecord> records,
            Map<String, List<Integer>> columnIndexesByName,
            double min,
            double max,
            String... columnNames
    ) {
        Double maxValue = null;

        for (CSVRecord record : records) {
            Double value = readNumber(record, columnIndexesByName, columnNames);

            if (!isInRange(value, min, max)) {
                continue;
            }

            if (maxValue == null || value > maxValue) {
                maxValue = value;
            }
        }

        return maxValue;
    }

    private boolean isInRange(Double value, double min, double max) {
        return value != null && value >= min && value <= max;
    }

    private Double readNumber(
            CSVRecord record,
            Map<String, List<Integer>> columnIndexesByName,
            String... columnNames
    ) {
        for (String columnName : columnNames) {
            List<Integer> columnIndexes = columnIndexesByName.get(columnName);

            if (columnIndexes == null || columnIndexes.isEmpty()) {
                continue;
            }

            for (Integer columnIndex : columnIndexes) {
                if (columnIndex >= record.size()) {
                    continue;
                }

                String rawValue = record.get(columnIndex);
                Double parsedValue = parseNumber(rawValue);

                if (parsedValue != null) {
                    return parsedValue;
                }
            }
        }

        return null;
    }

    private Double parseNumber(String rawValue) {
        if (rawValue == null) {
            return null;
        }

        String normalizedValue = rawValue
                .trim()
                .replace("\uFEFF", "")
                .replace("\"", "");

        if (normalizedValue.isBlank()) {
            return null;
        }

        try {
            return Double.parseDouble(normalizedValue);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Boolean anyYes(
            List<CSVRecord> records,
            Map<String, List<Integer>> columnIndexesByName,
            String... columnNames
    ) {
        for (CSVRecord record : records) {
            for (String columnName : columnNames) {
                List<Integer> columnIndexes = columnIndexesByName.get(columnName);

                if (columnIndexes == null || columnIndexes.isEmpty()) {
                    continue;
                }

                for (Integer columnIndex : columnIndexes) {
                    if (columnIndex >= record.size()) {
                        continue;
                    }

                    String rawValue = record.get(columnIndex);

                    if (rawValue == null) {
                        continue;
                    }

                    String normalizedValue = rawValue.trim();

                    if (normalizedValue.equalsIgnoreCase("Yes")
                            || normalizedValue.equalsIgnoreCase("True")
                            || normalizedValue.equals("1")) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}