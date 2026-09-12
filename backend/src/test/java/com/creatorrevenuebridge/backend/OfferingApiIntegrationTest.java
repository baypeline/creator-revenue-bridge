package com.creatorrevenuebridge.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the four read-only endpoints end to end against the real off-chain resources
 * (resources/offerings/1.json, application.properties valuation inputs). No chain artifacts are
 * generated in this checkout, so /api/chain/config is expected to fail closed with 503.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OfferingApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getOfferingReturnsOffChainMetadataAndTerms() throws Exception {
        mockMvc.perform(get("/api/offerings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offeringId").value(1))
                .andExpect(jsonPath("$.status").value("Funding"))
                .andExpect(jsonPath("$.statusLabel").value("모집 중"))
                .andExpect(jsonPath("$.terms.unitsForSale").value(100))
                .andExpect(jsonPath("$.terms.unitPrice.raw").value("100000000"))
                .andExpect(jsonPath("$.terms.unitPrice.decimals").value(6))
                .andExpect(jsonPath("$.terms.unitPrice.display").value("100.000000"))
                .andExpect(jsonPath("$.terms.targetRaise.raw").value("10000000000"))
                .andExpect(jsonPath("$.terms.revenueSharePercent").value(20.00));
    }

    @Test
    void getOfferingUnknownIdReturns404WithApiErrorBody() throws Exception {
        mockMvc.perform(get("/api/offerings/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("OFFERING_NOT_FOUND"));
    }

    @Test
    void getValuationReturnsPeriodBreakdownDrivenByConfiguredAssumptions() throws Exception {
        mockMvc.perform(get("/api/offerings/1/valuation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offeringId").value(1))
                .andExpect(jsonPath("$.assumptions.projectionMonths").value(3))
                .andExpect(jsonPath("$.periods.length()").value(3))
                .andExpect(jsonPath("$.periods[0].month").value(1))
                .andExpect(jsonPath("$.totalPresentValue.decimals").value(6));
    }

    @Test
    void getSettlementReturnsOffChainScheduleWithDisclaimer() throws Exception {
        mockMvc.perform(get("/api/offerings/1/settlement"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataSource").value("off-chain-plan"))
                .andExpect(jsonPath("$.periods.length()").value(3))
                .andExpect(jsonPath("$.periods[0].status").value("scheduled"))
                .andExpect(jsonPath("$.disclaimer").isNotEmpty());
    }

    @Test
    void getChainConfigFailsClosedWhenDeploymentArtifactsAreMissing() throws Exception {
        mockMvc.perform(get("/api/chain/config"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("CHAIN_ARTIFACTS_NOT_FOUND"));
    }
}
