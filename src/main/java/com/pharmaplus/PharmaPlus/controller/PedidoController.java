package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Pedido;
import com.pharmaplus.PharmaPlus.repository.PedidoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    private final PedidoRepository pedidoRepository;

    public PedidoController(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    @GetMapping
    public List<Pedido> listar() {
        return pedidoRepository.findAll();
    }


    @PostMapping
    public ResponseEntity<Map<String, Object>> salvar(@RequestBody Pedido pedido) {
        if (pedido.getMedicamento() == null || pedido.getMedicamento().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false,
                "mensagem", "Nome do medicamento é obrigatório."
            ));
        }
        if (pedido.getMotivo() == null || pedido.getMotivo().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false,
                "mensagem", "Motivo é obrigatório."
            ));
        }

        pedido.setData(LocalDate.now());
        pedido.setSituacao("Pendente");

        Pedido salvo = pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Pedido salvo com sucesso!",
            "id", salvo.getId()
        ));
    }


    @PatchMapping("/{id}/situacao")
    public ResponseEntity<Map<String, Object>> atualizarSituacao(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Pedido pedido = pedidoRepository.findById(id).orElse(null);
        if (pedido == null) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false,
                "mensagem", "Pedido não encontrado."
            ));
        }

        String situacao = (String) body.get("situacao");
        if (situacao == null || situacao.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false,
                "mensagem", "Campo 'situacao' é obrigatório."
            ));
        }

        List<String> situacoesValidas = List.of(
            "Pendente", "Aprovado", "Cancelado", "Em Andamento", "Concluído"
        );
        if (!situacoesValidas.contains(situacao)) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false,
                "mensagem", "Situação inválida. Valores aceitos: " + situacoesValidas
            ));
        }

        pedido.setSituacao(situacao);
        pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Situação atualizada para: " + situacao,
            "id", pedido.getId(),
            "situacao", situacao
        ));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletar(@PathVariable Long id) {
        if (!pedidoRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false,
                "mensagem", "Pedido não encontrado."
            ));
        }
        pedidoRepository.deleteById(id);
        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Pedido removido com sucesso!"
        ));
    }
}
