package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Medicamento;
import com.pharmaplus.PharmaPlus.model.MovimentacaoEstoque;
import com.pharmaplus.PharmaPlus.model.Usuario;
import com.pharmaplus.PharmaPlus.repository.MedicamentoEstoqueRepository;
import com.pharmaplus.PharmaPlus.repository.MovimentacaoEstoqueRepository;
import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;
import com.pharmaplus.PharmaPlus.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MedicamentoEstoqueController
 *
 * Endpoints:
 *   GET    /estoque/listar           → lista todos os medicamentos (ordenado por nome)
 *   PATCH  /estoque/editar/{id}      → edita quantidade e/ou status (incremento simples da tabela)
 *   PUT    /estoque/entrada/{id}     → registra entrada formal com movimentação rastreável
 *   DELETE /estoque/deletar/{id}     → remove medicamento
 *   POST   /estoque/adicionar        → cadastra novo medicamento
 *   GET    /estoque/dashboard        → dados resumidos para o painel principal
 *   GET    /estoque/historico/{id}   → histórico de movimentações de um medicamento
 */
@RestController
@RequestMapping("/estoque")
@CrossOrigin(origins = "*")
public class MedicamentoEstoqueController {

    private final MedicamentoEstoqueRepository  repository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final JwtUtil                       jwtUtil;
    private final UsuarioRepository             usuarioRepository; // BUG 8: injetado para buscar nome real

    public MedicamentoEstoqueController(
            MedicamentoEstoqueRepository repository,
            MovimentacaoEstoqueRepository movimentacaoRepository,
            JwtUtil jwtUtil,
            UsuarioRepository usuarioRepository) {
        this.repository             = repository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.jwtUtil                = jwtUtil;
        this.usuarioRepository      = usuarioRepository;
    }


    private String extrairResponsavel(String authHeader) {
        try {
            String  token     = authHeader.replace("Bearer ", "").trim();
            Integer matricula = jwtUtil.pegarMatricula(token);
            Usuario usuario   = usuarioRepository.findByMatricula(matricula);
            if (usuario != null && usuario.getNome() != null && !usuario.getNome().isBlank()) {
                return usuario.getNome();
            }
            return "Matrícula " + matricula;
        } catch (Exception e) {
            return "Sistema";
        }
    }


    @GetMapping("/listar")
    public ResponseEntity<List<Medicamento>> listar() {
        return ResponseEntity.ok(repository.findAllByOrderByNomeAsc());
    }

    @PostMapping("/adicionar")
    public ResponseEntity<Map<String, Object>> adicionar(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String nome = (String) body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false, "mensagem", "Nome do medicamento é obrigatório."
            ));
        }

        Medicamento med = new Medicamento();
        med.setNome(nome.trim());
        med.setCategoria((String) body.getOrDefault("categoria", "Original"));

        try {
            med.setQuantidade(((Number) body.getOrDefault("quantidade", 0)).intValue());
        } catch (Exception e) {
            med.setQuantidade(0);
        }

        String validadeStr = (String) body.get("validade");
        if (validadeStr != null && !validadeStr.isBlank()) {
            try { med.setValidade(LocalDate.parse(validadeStr)); } catch (Exception ignored) {}
        }

        med.setPrateleira((String) body.getOrDefault("prateleira", ""));
        med.setStatus((String) body.getOrDefault("status", "Disponível"));

        repository.save(med);

        if (med.getQuantidade() > 0) {
            MovimentacaoEstoque mov = new MovimentacaoEstoque();
            mov.setMedicamentoId(med.getId());
            mov.setNomeMedicamento(med.getNome());
            mov.setTipo("ENTRADA");
            mov.setQuantidadeAntes(0);
            mov.setQuantidadeDepois(med.getQuantidade());
            mov.setStatusAntes("—");
            mov.setStatusDepois(med.getStatus());
            mov.setResponsavel(extrairResponsavel(authHeader != null ? authHeader : ""));
            mov.setObservacao("Cadastro inicial");
            movimentacaoRepository.save(mov);
        }

        return ResponseEntity.ok(Map.of(
            "sucesso",  true,
            "mensagem", "Medicamento cadastrado com sucesso!",
            "id",       med.getId()
        ));
    }

    @PatchMapping("/editar/{id}")
    public ResponseEntity<Map<String, Object>> editar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Optional<Medicamento> opt = repository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false, "mensagem", "Medicamento não encontrado."
            ));
        }

        Medicamento med         = opt.get();
        int         qtdAntes    = med.getQuantidade();
        String      statusAntes = med.getStatus();
        String      tipoMov     = null;


        if (body.containsKey("quantidade")) {
            int nova;
            try {
                nova = ((Number) body.get("quantidade")).intValue();
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso", false, "mensagem", "Quantidade inválida."
                ));
            }
            if (nova < 0) nova = 0;
            med.setQuantidade(nova);


            if      (nova > qtdAntes) tipoMov = "ENTRADA";
            else if (nova < qtdAntes) tipoMov = "SAIDA";
            else                      tipoMov = "AJUSTE";


            if (nova == 0 && !"Sem Estoque".equals(med.getStatus())) {
                med.setStatus("Sem Estoque");
            } else if (nova > 0 && "Sem Estoque".equals(med.getStatus())) {
                med.setStatus("Disponível");
            }
        }


        if (body.containsKey("status")) {
            String novoStatus = (String) body.get("status");
            med.setStatus(novoStatus);
            tipoMov = "STATUS";
        }

        repository.save(med);

        if (tipoMov != null && (med.getQuantidade() != qtdAntes || !Objects.equals(med.getStatus(), statusAntes))) {
            MovimentacaoEstoque mov = new MovimentacaoEstoque();
            mov.setMedicamentoId(id);
            mov.setNomeMedicamento(med.getNome());
            mov.setTipo(tipoMov);
            mov.setQuantidadeAntes(qtdAntes);
            mov.setQuantidadeDepois(med.getQuantidade());
            mov.setStatusAntes(statusAntes);
            mov.setStatusDepois(med.getStatus());
            mov.setResponsavel(extrairResponsavel(authHeader != null ? authHeader : ""));
            mov.setObservacao("Ajuste rápido via painel");
            movimentacaoRepository.save(mov);
        }

        return ResponseEntity.ok(Map.of(
            "sucesso",         true,
            "mensagem",        "Medicamento atualizado com sucesso!",
            "quantidadeAtual", med.getQuantidade(),
            "statusAtual",     med.getStatus()
        ));
    }

    @PutMapping("/entrada/{id}")
    public ResponseEntity<Map<String, Object>> registrarEntrada(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Optional<Medicamento> opt = repository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false, "mensagem", "Medicamento não encontrado."
            ));
        }

        Medicamento med = opt.get();
        if (!body.containsKey("quantidade")) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false, "mensagem", "Campo 'quantidade' é obrigatório."
            ));
        }

        int qtdAdicionar;
        try {
            qtdAdicionar = ((Number) body.get("quantidade")).intValue();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false, "mensagem", "Quantidade inválida."
            ));
        }

        if (qtdAdicionar <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false, "mensagem", "A quantidade deve ser maior que zero."
            ));
        }

        String observacao = body.containsKey("observacao") && body.get("observacao") != null
            ? ((String) body.get("observacao")).trim()
            : "Entrada manual";

        if (observacao.isBlank()) observacao = "Entrada manual";

        int    quantidadeAntes = med.getQuantidade();
        String statusAntes     = med.getStatus();

        med.setQuantidade(quantidadeAntes + qtdAdicionar);

        if (med.getQuantidade() > 0 &&
            ("Sem Estoque".equals(med.getStatus()) || "Em Reposição".equals(med.getStatus()))) {
            med.setStatus("Disponível");
        }

        repository.save(med);

        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setMedicamentoId(id);
        mov.setNomeMedicamento(med.getNome());
        mov.setTipo("ENTRADA");
        mov.setQuantidadeAntes(quantidadeAntes);
        mov.setQuantidadeDepois(med.getQuantidade());
        mov.setStatusAntes(statusAntes);
        mov.setStatusDepois(med.getStatus());
        mov.setResponsavel(extrairResponsavel(authHeader != null ? authHeader : ""));
        mov.setObservacao(observacao);
        movimentacaoRepository.save(mov);

        return ResponseEntity.ok(Map.of(
            "sucesso",         true,
            "mensagem",        "Entrada de " + qtdAdicionar + " unidade(s) registrada com sucesso.",
            "quantidadeAntes", quantidadeAntes,
            "quantidadeAtual", med.getQuantidade(),
            "statusAtual",     med.getStatus(),
            "idMovimentacao",  mov.getId()
        ));
    }

    // ══════════════════════════════════════════════════════════════
    // DELETE /estoque/deletar/{id}
    // Remove um medicamento (e mantém o histórico de movimentações)
    // ══════════════════════════════════════════════════════════════
    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<Map<String, Object>> deletar(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Optional<Medicamento> opt = repository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false, "mensagem", "Medicamento não encontrado."
            ));
        }

        Medicamento med = opt.get();

        // Registra movimentação de saída total antes de remover
        if (med.getQuantidade() > 0) {
            MovimentacaoEstoque mov = new MovimentacaoEstoque();
            mov.setMedicamentoId(id);
            mov.setNomeMedicamento(med.getNome());
            mov.setTipo("SAIDA");
            mov.setQuantidadeAntes(med.getQuantidade());
            mov.setQuantidadeDepois(0);
            mov.setStatusAntes(med.getStatus());
            mov.setStatusDepois("Removido");
            mov.setResponsavel(extrairResponsavel(authHeader != null ? authHeader : ""));
            mov.setObservacao("Medicamento removido do sistema");
            movimentacaoRepository.save(mov);
        }

        repository.deleteById(id);

        return ResponseEntity.ok(Map.of(
            "sucesso",  true,
            "mensagem", "Medicamento removido com sucesso!"
        ));
    }

    // ══════════════════════════════════════════════════════════════
    // GET /estoque/dashboard
    // Retorna dados agregados consumidos pelo painel principal (home.js)
    // ══════════════════════════════════════════════════════════════
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        List<Medicamento> todos = repository.findAllByOrderByNomeAsc();
        LocalDate hoje         = LocalDate.now();
        LocalDate limite30Dias = hoje.plusDays(30);

        // Medicamentos vencendo nos próximos 30 dias (ou já vencidos)
        List<Map<String, Object>> vencendo = todos.stream()
            .filter(m -> m.getValidade() != null && !m.getValidade().isAfter(limite30Dias))
            .map(m -> {
                // ─────────────────────────────────────────────────────────
                // BUG 3 CORRIGIDO: cast (int) dias era perigoso pois `dias`
                // é long. Overflow silencioso para datas muito distantes.
                // Solução: manter como long no Map e deixar o JSON serializar
                // corretamente. O Comparator abaixo foi ajustado para Long.
                // ─────────────────────────────────────────────────────────
                long dias = hoje.until(m.getValidade(), ChronoUnit.DAYS);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id",            m.getId());
                entry.put("nome",          m.getNome());
                entry.put("validade",      m.getValidade().toString());
                entry.put("diasRestantes", dias); // ANTES: (int) dias — cast inseguro
                return entry;
            })
            .sorted(Comparator.comparingLong(m -> (long) m.get("diasRestantes"))) // ANTES: comparingInt
            .collect(Collectors.toList());

        // Estoque baixo (≤ 5 caixas) ou zerado
        List<Map<String, Object>> estoquesBaixos = todos.stream()
            .filter(m -> m.getQuantidade() <= 5)
            .map(m -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id",         m.getId());
                entry.put("nome",       m.getNome());
                entry.put("quantidade", m.getQuantidade());
                return entry;
            })
            .sorted(Comparator.comparingInt(m -> (int) m.get("quantidade")))
            .collect(Collectors.toList());

        // Contagem por categoria
        Map<String, Long> porCategoria = todos.stream()
            .filter(m -> m.getCategoria() != null)
            .collect(Collectors.groupingBy(Medicamento::getCategoria, Collectors.counting()));

        // Últimas movimentações globais (para o dashboard)
        List<MovimentacaoEstoque> ultimasMovimentacoes =
            movimentacaoRepository.findTop20ByOrderByDataHoraDesc();

        long zerados = todos.stream().filter(m -> m.getQuantidade() == 0).count();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("total",                todos.size());
        resultado.put("baixo",                (int) todos.stream().filter(m -> m.getQuantidade() > 0 && m.getQuantidade() <= 5).count());
        resultado.put("zerados",              (int) zerados);
        resultado.put("vencendo",             vencendo);
        resultado.put("estoquesBaixos",       estoquesBaixos);
        resultado.put("porCategoria",         porCategoria);
        resultado.put("ultimasMovimentacoes", ultimasMovimentacoes);

        return ResponseEntity.ok(resultado);
    }

    // ══════════════════════════════════════════════════════════════
    // GET /estoque/historico/{id}
    // Histórico de movimentações de um medicamento específico
    // ══════════════════════════════════════════════════════════════
    @GetMapping("/historico/{id}")
    public ResponseEntity<?> historico(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false, "mensagem", "Medicamento não encontrado."
            ));
        }
        List<MovimentacaoEstoque> lista =
            movimentacaoRepository.findByMedicamentoIdOrderByDataHoraDesc(id);
        return ResponseEntity.ok(lista);
    }
}
