package com.smartshop.config;

import com.cloudinary.Cloudinary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${CLOUD_NAME:}")
    private String cloudName;

    @Value("${CLOUD_KEY:}")
    private String apiKey;

    @Value("${CLOUD_SECRET:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        // Validate Cloudinary credentials
        if (cloudName == null || cloudName.isEmpty() ||
            apiKey == null || apiKey.isEmpty() ||
            apiSecret == null || apiSecret.isEmpty()) {
            logger.error("Cloudinary credentials are not properly configured!");
            throw new IllegalStateException("Cloudinary credentials are missing. Please check application.properties");
        }

        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);

        logger.info("Cloudinary configured with cloud_name: {}", cloudName);
        
        return new Cloudinary(config);
    }
}

