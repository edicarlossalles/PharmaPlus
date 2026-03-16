package com.pharmaplus.PharmaPlus.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /*
    SecurityConfig necessário para o JWT funcionar, aqui configuramos o comportamento de segurança que vem por padrão.
    Desabilita o CSRF (uma proteção contra ataques onde site malicioso faz requisição em nome do usuário), usamos JWT não faz sentido estar habilitado
    Configura o CORS: permissão que o navegador precisa para fazer requisições de um domínío para outro
    Spring bloqueia <iframe>, o H2 roda dentro de um iframe então desabilita para H2 funcionar
    sessioncreationpolicy: Fala para o Spring não criar sessão no servidor, cada requisição é independente e carrega o token junto
    authorizeHttpRequests: define quem pode acessar o quê
    basic e form desabilitado que são dois mecanismos de login padrão do Spring
     */

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // libera TUDO
                )
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable());

        return http.build();

    }


    //Configuração detalhada do CORS: quais origens, métodos e headers são permitidos.

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

}
