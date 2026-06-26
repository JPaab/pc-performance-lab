package com.pcperformancelab.hardware.service;

import com.pcperformancelab.hardware.dto.DetectedHardwareResponse;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
public class HardwareDetectionService {

    private static final Duration COMMAND_TIMEOUT = Duration.ofSeconds(10);

    public DetectedHardwareResponse detectLocalHardware() {
        String computerName = runPowerShell("""
                $env:COMPUTERNAME
                """);

        String cpu = runPowerShell("""
                ((Get-CimInstance Win32_Processor |
                  Select-Object -First 1 -ExpandProperty Name) `
                  -replace '\\(R\\)', '' `
                  -replace '\\(TM\\)', '' `
                  -replace '\\s+', ' ').Trim()
                """);

        String gpu = runPowerShell("""
                (Get-CimInstance Win32_VideoController |
                  Where-Object { $_.Name -notmatch 'Basic Display' } |
                  Select-Object -First 1 -ExpandProperty Name).Trim()
                """);

        String rawGpuDriver = runPowerShell("""
                (Get-CimInstance Win32_VideoController |
                  Where-Object { $_.Name -notmatch 'Basic Display' } |
                  Select-Object -First 1 -ExpandProperty DriverVersion).Trim()
                """);

        Integer ramGb = parseInteger(runPowerShell("""
                [int][math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
                """));

        String motherboard = runPowerShell("""
                $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1

                if ($board) {
                  $manufacturer = [string]$board.Manufacturer
                  $product = [string]$board.Product

                  $manufacturer = $manufacturer -replace 'Micro-Star International.*', 'MSI'
                  $manufacturer = ($manufacturer -replace '\\s+', ' ').Trim()
                  $product = ($product -replace '\\s+', ' ').Trim()

                  (@($manufacturer, $product) | Where-Object { $_ }) -join ' '
                }
                """);

        String storage = runPowerShell("""
                function Format-Capacity($bytes) {
                  if (-not $bytes) {
                    return $null
                  }

                  if ($bytes -ge 900000000000) {
                    $tb = [math]::Round($bytes / 1000000000000, 1)

                    if ($tb -ge 0.9 -and $tb -le 1.1) {
                      return "1 TB"
                    }

                    if ($tb -eq [math]::Floor($tb)) {
                      return "$([int]$tb) TB"
                    }

                    return ("$tb TB").Replace(',', '.')
                  }

                  $gb = [math]::Round($bytes / 1000000000)
                  return "$gb GB"
                }

                $items = @()

                try {
                  $items = @(
                    Get-PhysicalDisk |
                      Where-Object {
                        $_.BusType -ne 'USB' -and
                        $_.FriendlyName -notmatch 'USB|External'
                      } |
                      Sort-Object Size -Descending |
                      ForEach-Object {
                        $name = ([string]$_.FriendlyName -replace '\\s+', ' ').Trim()
                        $capacity = Format-Capacity $_.Size

                        if ($capacity) {
                          "$name $capacity"
                        } else {
                          "$name"
                        }
                      }
                  )
                } catch {
                  $items = @()
                }

                if ($items.Count -eq 0) {
                  $items = @(
                    Get-CimInstance Win32_DiskDrive |
                      Where-Object {
                        $_.Model -and
                        $_.Size -and
                        $_.InterfaceType -ne 'USB' -and
                        $_.MediaType -notmatch 'External|Removable' -and
                        $_.Model -notmatch 'USB|External'
                      } |
                      Sort-Object Size -Descending |
                      ForEach-Object {
                        $name = ([string]$_.Model -replace '\\s+', ' ').Trim()
                        $capacity = Format-Capacity $_.Size

                        if ($capacity) {
                          "$name $capacity"
                        } else {
                          "$name"
                        }
                      }
                  )
                }

                $cleanItems = @($items | Where-Object { $_ } | Select-Object -Unique)
                $cleanItems -join ' + '
                """);

        String monitor = runPowerShell("""
        Add-Type -AssemblyName System.Windows.Forms

        Add-Type @'
        using System;
        using System.Runtime.InteropServices;

        public class DisplaySettings {
            [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
            public struct DEVMODE {
                [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
                public string dmDeviceName;

                public short dmSpecVersion;
                public short dmDriverVersion;
                public short dmSize;
                public short dmDriverExtra;
                public int dmFields;

                public int dmPositionX;
                public int dmPositionY;
                public int dmDisplayOrientation;
                public int dmDisplayFixedOutput;

                public short dmColor;
                public short dmDuplex;
                public short dmYResolution;
                public short dmTTOption;
                public short dmCollate;

                [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
                public string dmFormName;

                public short dmLogPixels;
                public int dmBitsPerPel;
                public int dmPelsWidth;
                public int dmPelsHeight;
                public int dmDisplayFlags;
                public int dmDisplayFrequency;

                public int dmICMMethod;
                public int dmICMIntent;
                public int dmMediaType;
                public int dmDitherType;
                public int dmReserved1;
                public int dmReserved2;
                public int dmPanningWidth;
                public int dmPanningHeight;
            }

            [DllImport("user32.dll")]
            public static extern bool EnumDisplaySettings(
                string deviceName,
                int modeNum,
                ref DEVMODE devMode
            );

            public const int ENUM_CURRENT_SETTINGS = -1;
        }
        '@

        $names = @(
          Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorID |
            ForEach-Object {
              $chars = @($_.UserFriendlyName | Where-Object { $_ -ne 0 })

              if ($chars.Count -gt 0) {
                $name = (($chars | ForEach-Object { [char]$_ }) -join '').Trim()
                $name.TrimEnd('-').Trim()
              }
            } |
            Where-Object { $_ } |
            Select-Object -Unique
        )

        $screens = @(
          [System.Windows.Forms.Screen]::AllScreens |
            ForEach-Object {
              $mode = New-Object DisplaySettings+DEVMODE
              $mode.dmSize = [System.Runtime.InteropServices.Marshal]::SizeOf($mode)

              [void][DisplaySettings]::EnumDisplaySettings(
                $_.DeviceName,
                [DisplaySettings]::ENUM_CURRENT_SETTINGS,
                [ref]$mode
              )

              [PSCustomObject]@{
                DeviceName = $_.DeviceName
                Width = $_.Bounds.Width
                Height = $_.Bounds.Height
                RefreshRate = $mode.dmDisplayFrequency
              }
            }
        )

        $items = @()

        for ($index = 0; $index -lt $screens.Count; $index++) {
          $screen = $screens[$index]
          $displayName = $null

          if ($index -lt $names.Count) {
            $displayName = $names[$index]
          }

          if (-not $displayName) {
            $displayName = $screen.DeviceName
          }

          $resolution = "$($screen.Width)x$($screen.Height)"
          $hz = $screen.RefreshRate

          if ($hz -and $hz -gt 1) {
            $items += "$displayName - $resolution @$($hz)Hz"
          } else {
            $items += "$displayName - $resolution"
          }
        }

        $items -join ' / '
        """);

        String operatingSystem = runPowerShell("""
                $os = Get-CimInstance Win32_OperatingSystem
                $version = (Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').DisplayVersion
                (($os.Caption + ' ' + $version) -replace '\\s+', ' ').Trim()
                """);

        String biosVersion = runPowerShell("""
                $bios = Get-CimInstance Win32_BIOS

                $fullVersion = @($bios.BIOSVersion) |
                  Where-Object {
                    $_ -and
                    $_ -notmatch 'ALASKA|American Megatrends|BIOS Date'
                  } |
                  Select-Object -First 1

                if ($fullVersion) {
                  $fullVersion.Trim()
                } else {
                  ($bios.SMBIOSBIOSVersion).Trim()
                }
                """);

        String gpuDriver = normalizeGpuDriver(gpu, rawGpuDriver);

        return new DetectedHardwareResponse(
                cleanHardwareValue(computerName),
                cleanHardwareValue(cpu),
                cleanHardwareValue(gpu),
                ramGb,
                cleanHardwareValue(motherboard),
                cleanHardwareValue(storage),
                cleanHardwareValue(monitor),
                cleanHardwareValue(operatingSystem),
                cleanHardwareValue(gpuDriver),
                cleanHardwareValue(biosVersion)
        );
    }

    private String runPowerShell(String command) {
        try {
            String wrappedCommand = """
                $ErrorActionPreference = 'SilentlyContinue'
                $ProgressPreference = 'SilentlyContinue'
                $VerbosePreference = 'SilentlyContinue'
                $DebugPreference = 'SilentlyContinue'
                $InformationPreference = 'SilentlyContinue'
                $WarningPreference = 'SilentlyContinue'

                try {
                %s
                } catch {
                }
                """.formatted(command);

            String encodedCommand = Base64.getEncoder().encodeToString(
                    wrappedCommand.getBytes(StandardCharsets.UTF_16LE)
            );

            Process process = new ProcessBuilder(
                    "powershell.exe",
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-OutputFormat",
                    "Text",
                    "-EncodedCommand",
                    encodedCommand
            )
                    .redirectError(ProcessBuilder.Redirect.DISCARD)
                    .start();

            StringBuilder output = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8)
            )) {
                String line;

                while ((line = reader.readLine()) != null) {
                    if (!line.isBlank()) {
                        if (!output.isEmpty()) {
                            output.append(" ");
                        }

                        output.append(line.trim());
                    }
                }
            }

            boolean finished = process.waitFor(
                    COMMAND_TIMEOUT.toSeconds(),
                    TimeUnit.SECONDS
            );

            if (!finished) {
                process.destroyForcibly();
                return null;
            }

            return clean(output.toString());
        } catch (Exception exception) {
            return null;
        }
    }

    private String normalizeGpuDriver(String gpu, String rawDriverVersion) {
        String cleanedDriver = clean(rawDriverVersion);

        if (cleanedDriver == null) {
            return null;
        }

        if (gpu == null || !gpu.toLowerCase(Locale.ROOT).contains("nvidia")) {
            return cleanedDriver;
        }

        String[] parts = cleanedDriver.split("\\.");

        if (parts.length < 4) {
            return cleanedDriver;
        }

        String branch = parts[2];
        String build = parts[3];

        if (branch.isBlank() || build.length() < 4) {
            return cleanedDriver;
        }

        try {
            int hundreds = Integer.parseInt(branch.substring(branch.length() - 1)) * 100;
            int major = hundreds + Integer.parseInt(build.substring(0, 2));
            String minor = build.substring(2);

            return major + "." + minor;
        } catch (NumberFormatException exception) {
            return cleanedDriver;
        }
    }

    private Integer parseInteger(String value) {
        String cleaned = clean(value);

        if (cleaned == null) {
            return null;
        }

        try {
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String cleanHardwareValue(String value) {
        String cleaned = clean(value);

        if (cleaned == null) {
            return null;
        }

        String normalized = cleaned.toLowerCase(Locale.ROOT);

        if (
                normalized.equals("to be filled by o.e.m.") ||
                        normalized.equals("system product name") ||
                        normalized.equals("default string") ||
                        normalized.equals("none") ||
                        normalized.equals("unknown")
        ) {
            return null;
        }

        return cleaned;
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value
                .replace("\u0000", "")
                .replaceAll("\\s+", " ")
                .trim();

        return cleaned.isBlank() ? null : cleaned;
    }
}