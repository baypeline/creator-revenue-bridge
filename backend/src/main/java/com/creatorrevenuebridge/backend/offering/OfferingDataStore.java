package com.creatorrevenuebridge.backend.offering;

import com.creatorrevenuebridge.backend.offering.dto.OfferingRecord;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Loads and caches resources/offerings/{offeringId}.json. Shared by the offering, valuation and
 * settlement services so all three read the same off-chain product definition.
 */
@Component
public class OfferingDataStore {

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;
    private final Map<Long, OfferingRecord> cache = new ConcurrentHashMap<>();

    public OfferingDataStore(ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
    }

    public OfferingRecord get(long offeringId) {
        OfferingRecord cached = cache.get(offeringId);
        if (cached != null) {
            return cached;
        }
        OfferingRecord loaded = load(offeringId);
        cache.put(offeringId, loaded);
        return loaded;
    }

    private OfferingRecord load(long offeringId) {
        String location = "classpath:offerings/" + offeringId + ".json";
        Resource resource = resourceLoader.getResource(location);
        if (!resource.exists()) {
            throw new OfferingNotFoundException(offeringId);
        }
        try (InputStream in = resource.getInputStream()) {
            return objectMapper.readValue(in, OfferingRecord.class);
        } catch (IOException e) {
            throw new OfferingNotFoundException(offeringId, e);
        }
    }
}
