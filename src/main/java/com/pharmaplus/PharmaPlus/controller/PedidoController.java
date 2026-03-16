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
