package com.pharmaplus.PharmaPlus.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/bulario")
@CrossOrigin(origins = "*")
public class BularioProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper       = new ObjectMapper();

    private HttpEntity<Void> criarEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept",          "application/json, text/plain, */*");
        headers.set("Accept-Language", "pt-BR,pt;q=0.9");
        headers.set("User-Agent",      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        headers.set("Referer",         "https://consultas.anvisa.gov.br/");
        headers.set("Origin",          "https://consultas.anvisa.gov.br");
        return new HttpEntity<>(headers);
    }

    private HttpEntity<Void> criarEntityPdf() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept",          "application/pdf,*/*");
        headers.set("Accept-Language", "pt-BR,pt;q=0.9");
        headers.set("User-Agent",      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        headers.set("Referer",         "https://consultas.anvisa.gov.br/");
        headers.set("Origin",          "https://consultas.anvisa.gov.br");
        return new HttpEntity<>(headers);
    }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscar(@RequestParam String nome) {
        try {
            String encoded = URLEncoder.encode(nome, StandardCharsets.UTF_8);
            String url     = "https://consultas.anvisa.gov.br/api/consulta/bulario"
                           + "?count=20&filter%5BnomeProduto%5D=" + encoded;

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, criarEntity(), String.class
            );

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response.getBody());

        } catch (Exception e) {
            return ResponseEntity.status(502).body(
                Map.of("erro", "Não foi possível conectar à ANVISA: " + e.getMessage())
            );
        }
    }

    @GetMapping("/bula-pdf-url")
    public ResponseEntity<?> getBulaPdfUrl(@RequestParam String nome) {
        try {
            String encoded  = URLEncoder.encode(nome, StandardCharsets.UTF_8);
            String urlBusca = "https://consultas.anvisa.gov.br/api/consulta/bulario"
                            + "?count=1&filter%5BnomeProduto%5D=" + encoded;

            ResponseEntity<String> response = restTemplate.exchange(
                urlBusca, HttpMethod.GET, criarEntity(), String.class
            );

            JsonNode root    = mapper.readTree(response.getBody());
            JsonNode content = root.path("content");

            if (content.isArray() && content.size() > 0) {
                JsonNode item = content.get(0);

                String idBula = item.path("idBulaPacienteProtegido").asText(null);
                if (idBula == null || idBula.isBlank()) {
                    idBula = item.path("idBulaProfissionalProtegido").asText(null);
                }

                if (idBula != null && !idBula.isBlank()) {
                    return ResponseEntity.ok(Map.of(
                        "sucesso",     true,
                        "idDocumento", idBula,       // NOVO: frontend usa isso para chamar /bula-pdf
                        "nome",        item.path("nomeProduto").asText(""),
                        "empresa",     item.path("razaoSocial").asText(""),
                        "proxyUrl",    "/bulario/bula-pdf?idDocumento=" + idBula // URL pronta para o <iframe>
                    ));
                }
            }

            return ResponseEntity.ok(Map.of(
                "sucesso",  false,
                "mensagem", "Bula não encontrada para este medicamento."
            ));

        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                "sucesso", false,
                "erro",    e.getMessage()
            ));
        }
    }

    @GetMapping("/bula-pdf")
    public ResponseEntity<byte[]> getBulaPdf(@RequestParam String idDocumento) {
        try {
            if (idDocumento == null || idDocumento.isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            String pdfUrl = "https://consultas.anvisa.gov.br/api/consulta/bulario/pdf"
                          + "?idDocumento=" + URLEncoder.encode(idDocumento, StandardCharsets.UTF_8);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                pdfUrl, HttpMethod.GET, criarEntityPdf(), byte[].class
            );

            if (response.getBody() == null || response.getBody().length == 0) {
                return ResponseEntity.status(404).build();
            }

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                // Inline para renderizar direto no <iframe>, não forçar download
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"bula.pdf\"")
                .body(response.getBody());

        } catch (Exception e) {
            return ResponseEntity.status(502).build();
        }
    }
}
