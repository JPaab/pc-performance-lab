package com.pcperformancelab.sensor.importer;

import com.pcperformancelab.sensor.dto.SensorSummaryData;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Predicate;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class HwInfoCsvImportService {

    private static final Charset HWINFO_CHARSET = Charset.forName("windows-1252");

    public SensorSummaryData importCsv(MultipartFile file) {
        return parseCsv(file);
    }

    public SensorSummaryData importHwInfoCsv(MultipartFile file) {
        return parseCsv(file);
    }

    public SensorSummaryData parse(MultipartFile file) {
        return parseCsv(file);
    }

    private SensorSummaryData parseCsv(MultipartFile file) {
        try (
                Reader reader = new InputStreamReader(file.getInputStream(), HWINFO_CHARSET);
                CSVParser parser = CSVFormat.DEFAULT.builder()
                        .setTrim(true)
                        .setIgnoreSurroundingSpaces(true)
                        .build()
                        .parse(reader)
        ) {
            List<CSVRecord> records = parser.getRecords();

            if (records.size() < 2) {
                throw new IllegalArgumentException("HWiNFO CSV does not contain enough data rows.");
            }

            CSVRecord headerRecord = records.get(0);
            List<CSVRecord> dataRecords = records.subList(1, records.size());
            Map<String, List<Integer>> columns = buildColumnIndex(headerRecord);

            return new SensorSummaryData(
                    dataRecords.size(),

                    averageByNames(dataRecords, columns, List.of("CPU Package [°C]"), -20, 130),
                    maxByNames(dataRecords, columns, List.of("CPU Package [°C]"), -20, 130),
                    maxByNames(dataRecords, columns, List.of("Core Max [°C]"), -20, 130),
                    averageByNames(dataRecords, columns, List.of("CPU Package Power [W]"), 0, 400),
                    maxByNames(dataRecords, columns, List.of("CPU Package Power [W]"), 0, 400),
                    averageByNames(dataRecords, columns, List.of("Total CPU Usage [%]"), 0, 100),
                    averageByNames(dataRecords, columns, List.of("Physical Memory Load [%]"), 0, 100),
                    maxByNames(dataRecords, columns, List.of("Physical Memory Load [%]"), 0, 100),

                    averageByNames(dataRecords, columns, List.of("GPU Temperature [°C]"), -20, 130),
                    maxByNames(dataRecords, columns, List.of("GPU Temperature [°C]"), -20, 130),
                    averageByNames(dataRecords, columns, List.of("GPU Hot Spot Temperature [°C]"), -20, 140),
                    maxByNames(dataRecords, columns, List.of("GPU Hot Spot Temperature [°C]"), -20, 140),
                    averageByNames(dataRecords, columns, List.of("GPU Power [W]"), 0, 700),
                    maxByNames(dataRecords, columns, List.of("GPU Power [W]"), 0, 700),
                    averageByNames(dataRecords, columns, List.of("GPU Clock [MHz]"), 0, 4000),
                    maxByNames(dataRecords, columns, List.of("GPU Clock [MHz]"), 0, 4000),
                    averageByNames(dataRecords, columns, List.of("GPU Memory Clock [MHz]"), 0, 12000),
                    averageByNames(dataRecords, columns, List.of("GPU Core Load [%]"), 0, 100),
                    maxByNames(dataRecords, columns, List.of("GPU Core Load [%]"), 0, 100),
                    averageByNames(dataRecords, columns, List.of("GPU Memory Usage [%]"), 0, 100),
                    maxByNames(dataRecords, columns, List.of("GPU Memory Usage [%]"), 0, 100),

                    averageByNames(dataRecords, columns, List.of("GPU Memory Junction Temperature [°C]"), -20, 140),
                    maxByNames(dataRecords, columns, List.of("GPU Memory Junction Temperature [°C]"), -20, 140),
                    averageByNames(dataRecords, columns, List.of("GPU Effective Clock [MHz]"), 0, 4000),
                    maxByNames(dataRecords, columns, List.of("GPU Effective Clock [MHz]"), 0, 4000),

                    averageByNames(dataRecords, columns, List.of("Average Effective Clock [MHz]", "Core Effective Clocks (avg) [MHz]"), 0, 6000),
                    maxByNames(dataRecords, columns, List.of("Average Effective Clock [MHz]", "Core Effective Clocks (avg) [MHz]"), 0, 6000),

                    averageByHeaderMatch(dataRecords, columns, HwInfoCsvImportService::isPcoreClockHeader, 0, 6000),
                    maxByHeaderMatch(dataRecords, columns, HwInfoCsvImportService::isPcoreClockHeader, 0, 6000),
                    averageByHeaderMatch(dataRecords, columns, HwInfoCsvImportService::isEcoreClockHeader, 0, 6000),
                    maxByHeaderMatch(dataRecords, columns, HwInfoCsvImportService::isEcoreClockHeader, 0, 6000),
                    averageByNames(dataRecords, columns, List.of("Ring/LLC Clock [MHz]"), 0, 6000),
                    maxByNames(dataRecords, columns, List.of("Ring/LLC Clock [MHz]"), 0, 6000),

                    anyYesByHeaderMatch(dataRecords, columns, HwInfoCsvImportService::isCpuThermalThrottleHeader),
                    anyYesByHeaderMatch(dataRecords, columns, HwInfoCsvImportService::isCpuPowerLimitHeader),
                    anyYesByNames(dataRecords, columns, List.of(
                            "IA: Thermal Event [Yes/No]",
                            "IA: Running Average Thermal Limit [Yes/No]",
                            "IA: VR Thermal Alert [Yes/No]",
                            "RING: Thermal Event [Yes/No]",
                            "RING: Running Average Thermal Limit [Yes/No]",
                            "RING: VR Thermal Alert [Yes/No]"
                    )),

                    anyYesByNames(dataRecords, columns, List.of("GPU Performance Limiters (avg) [Yes/No]")),
                    anyYesByNames(dataRecords, columns, List.of("Performance Limit - Power [Yes/No]")),
                    anyYesByNames(dataRecords, columns, List.of("Performance Limit - Thermal [Yes/No]")),
                    anyYesByNames(dataRecords, columns, List.of("Performance Limit - Reliability Voltage [Yes/No]")),
                    anyYesByNames(dataRecords, columns, List.of("Performance Limit - Max Operating Voltage [Yes/No]")),
                    anyYesByNames(dataRecords, columns, List.of("Performance Limit - Utilization [Yes/No]"))
            );
        } catch (IOException exception) {
            throw new IllegalArgumentException("Could not read HWiNFO CSV file.", exception);
        }
    }

    private static Map<String, List<Integer>> buildColumnIndex(CSVRecord headerRecord) {
        Map<String, List<Integer>> columns = new TreeMap<>();

        for (int index = 0; index < headerRecord.size(); index++) {
            String header = normalizeHeader(headerRecord.get(index));

            if (header.isBlank()) {
                continue;
            }

            columns.computeIfAbsent(header, ignored -> new ArrayList<>()).add(index);
        }

        return columns;
    }

    private static Double averageByNames(
            List<CSVRecord> records,
            Map<String, List<Integer>> columns,
            List<String> headerNames,
            double min,
            double max
    ) {
        return averageByHeaderMatch(records, columns, headerNames::contains, min, max);
    }

    private static Double maxByNames(
            List<CSVRecord> records,
            Map<String, List<Integer>> columns,
            List<String> headerNames,
            double min,
            double max
    ) {
        return maxByHeaderMatch(records, columns, headerNames::contains, min, max);
    }

    private static Double averageByHeaderMatch(
            List<CSVRecord> records,
            Map<String, List<Integer>> columns,
            Predicate<String> headerMatcher,
            double min,
            double max
    ) {
        double total = 0;
        int count = 0;

        for (Map.Entry<String, List<Integer>> entry : columns.entrySet()) {
            if (!headerMatcher.test(entry.getKey())) {
                continue;
            }

            for (int columnIndex : entry.getValue()) {
                for (CSVRecord record : records) {
                    Double value = parseNumber(safeGet(record, columnIndex));

                    if (value != null && value >= min && value <= max) {
                        total += value;
                        count++;
                    }
                }
            }
        }

        if (count == 0) {
            return null;
        }

        return roundTwoDecimals(total / count);
    }

    private static Double maxByHeaderMatch(
            List<CSVRecord> records,
            Map<String, List<Integer>> columns,
            Predicate<String> headerMatcher,
            double min,
            double max
    ) {
        Double currentMax = null;

        for (Map.Entry<String, List<Integer>> entry : columns.entrySet()) {
            if (!headerMatcher.test(entry.getKey())) {
                continue;
            }

            for (int columnIndex : entry.getValue()) {
                for (CSVRecord record : records) {
                    Double value = parseNumber(safeGet(record, columnIndex));

                    if (value != null && value >= min && value <= max) {
                        currentMax = currentMax == null ? value : Math.max(currentMax, value);
                    }
                }
            }
        }

        return currentMax == null ? null : roundTwoDecimals(currentMax);
    }

    private static Boolean anyYesByNames(
            List<CSVRecord> records,
            Map<String, List<Integer>> columns,
            List<String> headerNames
    ) {
        return anyYesByHeaderMatch(records, columns, headerNames::contains);
    }

    private static Boolean anyYesByHeaderMatch(
            List<CSVRecord> records,
            Map<String, List<Integer>> columns,
            Predicate<String> headerMatcher
    ) {
        for (Map.Entry<String, List<Integer>> entry : columns.entrySet()) {
            if (!headerMatcher.test(entry.getKey())) {
                continue;
            }

            for (int columnIndex : entry.getValue()) {
                for (CSVRecord record : records) {
                    if (isYes(safeGet(record, columnIndex))) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static String safeGet(CSVRecord record, int index) {
        if (index < 0 || index >= record.size()) {
            return "";
        }

        return record.get(index);
    }

    private static Double parseNumber(String rawValue) {
        if (rawValue == null) {
            return null;
        }

        String value = rawValue
                .replace("\uFEFF", "")
                .replace("\"", "")
                .trim();

        if (value.isBlank()) {
            return null;
        }

        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static boolean isYes(String rawValue) {
        if (rawValue == null) {
            return false;
        }

        String value = rawValue.trim().toLowerCase(Locale.ROOT);

        return value.equals("yes")
                || value.equals("y")
                || value.equals("true")
                || value.equals("1");
    }

    private static String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }

        return header
                .replace("\uFEFF", "")
                .replace("\"", "")
                .trim();
    }

    private static boolean isPcoreClockHeader(String header) {
        return header.matches("P-core \\d+ Clock \\[MHz]");
    }

    private static boolean isEcoreClockHeader(String header) {
        return header.matches("E-core \\d+ Clock \\[MHz]");
    }

    private static boolean isCpuThermalThrottleHeader(String header) {
        return header.equals("Core Thermal Throttling (avg) [Yes/No]")
                || header.matches("P-core \\d+ Thermal Throttling \\[Yes/No]")
                || header.matches("E-core \\d+ Thermal Throttling \\[Yes/No]")
                || header.equals("Package/Ring Thermal Throttling [Yes/No]");
    }

    private static boolean isCpuPowerLimitHeader(String header) {
        return header.equals("Core Power Limit Exceeded (avg) [Yes/No]")
                || header.matches("P-core \\d+ Power Limit Exceeded \\[Yes/No]")
                || header.matches("E-core \\d+ Power Limit Exceeded \\[Yes/No]")
                || header.equals("Package/Ring Power Limit Exceeded [Yes/No]");
    }

    private static Double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}