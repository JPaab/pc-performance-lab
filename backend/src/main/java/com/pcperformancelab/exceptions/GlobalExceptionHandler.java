package com.pcperformancelab.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        ApiError apiError = new ApiError(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed",
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity.badRequest().body(apiError);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(
            ResponseStatusException exception,
            HttpServletRequest request
    ) {
        HttpStatusCode statusCode = exception.getStatusCode();

        ApiError apiError = new ApiError(
                Instant.now(),
                statusCode.value(),
                resolveReasonPhrase(statusCode),
                exception.getReason() == null ? "Request failed" : exception.getReason(),
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.status(statusCode).body(apiError);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableMessage(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        ApiError apiError = new ApiError(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Malformed JSON request",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(apiError);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(
            Exception exception,
            HttpServletRequest request
    ) {
        ApiError apiError = new ApiError(
                Instant.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Unexpected server error",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.internalServerError().body(apiError);
    }

    private String resolveReasonPhrase(HttpStatusCode statusCode) {
        HttpStatus httpStatus = HttpStatus.resolve(statusCode.value());

        if (httpStatus == null) {
            return "HTTP " + statusCode.value();
        }

        return httpStatus.getReasonPhrase();
    }
}