package com.pcperformancelab.sensor.importer;

import com.pcperformancelab.sensor.dto.SensorSummaryData;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class HwInfoCsvImportService {

    public SensorSummaryData parse(MultipartFile file) {
        try (
                Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1);
                CSVParser parser = CSVFormat.DEFAULT.parse(reader)
        ) {
            Iterator<CSVRecord> iterator = parser.iterator();

            if (!iterator.hasNext()) {
                throw new ResponseStatusException(BAD_REQUEST, "HWiNFO CSV file is empty");
            }

            CSVRecord headerRecord = iterator.next();
            Map<String, Integer> headerIndexes = buildHeaderIndex(headerRecord);

            ColumnStats cpuPackageTemp = new ColumnStats();
            ColumnStats cpuCoreMaxTemp = new ColumnStats();
            ColumnStats cpuPackagePower = new ColumnStats();
            ColumnStats totalCpuUsage = new ColumnStats();
            ColumnStats physicalMemoryLoad = new ColumnStats();

            ColumnStats gpuTemperature = new ColumnStats();
            ColumnStats gpuHotSpotTemperature = new ColumnStats();
            ColumnStats gpuPower = new ColumnStats();
            ColumnStats gpuClock = new ColumnStats();
            ColumnStats gpuMemoryClock = new ColumnStats();
            ColumnStats gpuCoreLoad = new ColumnStats();
            ColumnStats gpuMemoryUsage = new ColumnStats();

            int sampleCount = 0;

            while (iterator.hasNext()) {
                CSVRecord record = iterator.next();

                if (record.size() < 3) {
                    continue;
                }

                sampleCount++;

                cpuPackageTemp.add(readDouble(record, headerIndexes, "CPU Package [°C]"));
                cpuCoreMaxTemp.add(readDouble(record, headerIndexes, "Core Max [°C]"));
                cpuPackagePower.add(readDouble(record, headerIndexes, "CPU Package Power [W]"));
                totalCpuUsage.add(readDouble(record, headerIndexes, "Total CPU Usage [%]"));
                physicalMemoryLoad.add(readDouble(record, headerIndexes, "Physical Memory Load [%]"));

                gpuTemperature.add(readDouble(record, headerIndexes, "GPU Temperature [°C]"));
                gpuHotSpotTemperature.add(readDouble(record, headerIndexes, "GPU Hot Spot Temperature [°C]"));
                gpuPower.add(readDouble(record, headerIndexes, "GPU Power [W]"));
                gpuClock.add(readDouble(record, headerIndexes, "GPU Clock [MHz]"));
                gpuMemoryClock.add(readDouble(record, headerIndexes, "GPU Memory Clock [MHz]"));
                gpuCoreLoad.add(readDouble(record, headerIndexes, "GPU Core Load [%]"));
                gpuMemoryUsage.add(readDouble(record, headerIndexes, "GPU Memory Usage [%]"));
            }

            if (sampleCount == 0) {
                throw new ResponseStatusException(BAD_REQUEST, "HWiNFO CSV file does not contain sensor rows");
            }

            return new SensorSummaryData(
                    sampleCount,

                    cpuPackageTemp.average(),
                    cpuPackageTemp.max(),
                    cpuCoreMaxTemp.max(),
                    cpuPackagePower.average(),
                    cpuPackagePower.max(),
                    totalCpuUsage.average(),
                    physicalMemoryLoad.average(),
                    physicalMemoryLoad.max(),

                    gpuTemperature.average(),
                    gpuTemperature.max(),
                    gpuHotSpotTemperature.average(),
                    gpuHotSpotTemperature.max(),
                    gpuPower.average(),
                    gpuPower.max(),
                    gpuClock.average(),
                    gpuClock.max(),
                    gpuMemoryClock.average(),
                    gpuCoreLoad.average(),
                    gpuCoreLoad.max(),
                    gpuMemoryUsage.average(),
                    gpuMemoryUsage.max()
            );
        } catch (IOException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid HWiNFO CSV file");
        }
    }

    private Map<String, Integer> buildHeaderIndex(CSVRecord headerRecord) {
        Map<String, Integer> indexes = new HashMap<>();

        for (int index = 0; index < headerRecord.size(); index++) {
            String header = headerRecord.get(index);

            if (header != null && !header.isBlank()) {
                indexes.putIfAbsent(header.trim(), index);
            }
        }

        return indexes;
    }

    private Double readDouble(CSVRecord record, Map<String, Integer> headerIndexes, String columnName) {
        Integer index = headerIndexes.get(columnName);

        if (index == null || index >= record.size()) {
            return null;
        }

        String rawValue = record.get(index);

        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        try {
            return Double.parseDouble(rawValue.trim().replace(",", "."));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static class ColumnStats {

        private int count;
        private double sum;
        private Double max;

        void add(Double value) {
            if (value == null || value.isNaN() || value.isInfinite()) {
                return;
            }

            count++;
            sum += value;

            if (max == null || value > max) {
                max = value;
            }
        }

        Double average() {
            if (count == 0) {
                return null;
            }

            return round(sum / count);
        }

        Double max() {
            if (max == null) {
                return null;
            }

            return round(max);
        }

        private Double round(double value) {
            return Math.round(value * 100.0) / 100.0;
        }
    }
}