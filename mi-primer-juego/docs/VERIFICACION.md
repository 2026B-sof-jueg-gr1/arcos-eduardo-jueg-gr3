# Verificación — 2026-10-29

## Matriz de aceptación

| Criterio de PLAN.md | Estado | Evidencia |
| --- | --- | --- |
| 1. Carpeta, Phaser 3 y assets genéricos | Cumple | Todo el juego en mi-primer-juego; Phaser 3.90.0 por CDN y respaldo local; licencia incluida; arte generado en Graphics. |
| 2. Movimiento y salto cargado | Cumple en Chromium | Movimiento con flechas/A/D, dos longitudes de carga y cambio de dirección en el aire probado sin alterar la trayectoria. |
| 3. Cinco zonas alcanzables | Cumple en Chromium | Recorrido continuo de 25 saltos, desde el suelo hasta la corona, sin teletransportes ni cambios de coordenadas. |
| 4. Colisión, caída y cámara | Cumple en Chromium | Techos y pared lateral probados; caída desde Ruinas hacia Bosque; cámara convergió hasta la cumbre. |
| 5. Ciclo completo | Cumple en Chromium | Inicio, pausa congela física/tiempo, cancelar/confirmar reinicio, victoria, nuevo intento, blur y cancelación de carga. Reinicio limpia también avisos de zona. |
| 6. Interfaz y controles | Cumple en Chromium | Español; teclado y eventos táctiles nativos CDP; 390 × 844 sin desbordamiento; contadores y récord local. |
| 7. Pruebas | Cumple en el alcance descrito | 5 pruebas Node y 18 comprobaciones de integración, también contra Pages; sin errores JavaScript en la ejecución final. |
| 8. Push y Pages | Cumple | Push a main confirmado; despliegue 40891045012 aprobado; prueba pública 40891046139 aprobada, incluidos HTTP 200, hashes y recorrido de victoria. |
| 9. Continuidad | Cumple | README, PLAN.md, VERIFICACION.md, ESTADO.md y evidencia JSON. |

## Resultados medidos

- Carga corta: altura máxima 29.25 px; carga completa: 177.39 px en Arcade.
- Caída intencional tras diez saltos: zona 2 → zona 1 (índices desde cero), contador de caídas = 1; aterrizaje a y=2280, sin reinicio de posición.
- Recorrido continuo final: 25 saltos, 0 caídas, victoria; aproximadamente 46.57 segundos simulados.
- Cada paso del recorrido se registra en `evidence/results.json`. El tiempo es de simulación de prueba, no una marca humana.

## Método y límites

Se usó Chromium real con renderizado, Phaser 3.90.0 y física Arcade. El harness detiene el reloj automático y avanza cuadros de 1/60 s para reproducir las entradas. El recorrido ganador envía eventos de teclado y no cambia posiciones, plataformas, gravedad ni velocidad. Las pruebas aisladas de pared y techo sí posicionan fixtures, separadas del recorrido.

La CDN se bloquea deliberadamente en esta suite para comprobar el respaldo local. Las capturas confirman el renderizado de escritorio y móvil. El registro del récord se comprueba en localStorage; almacenamiento inválido o denegado se prueba en Node. No se probaron Safari, Firefox ni un dispositivo móvil físico. El sonido y el modo pantalla completa están implementados, pero no cuentan con prueba de audio perceptual o de dispositivo. La URL de producción fue probada desde GitHub Actions con la misma suite de navegador y una comprobación adicional de HTTP e integridad de assets.

Para repetir, ver README. `.github/workflows/verify.yml` reproduce modelo, sintaxis y navegador en GitHub Actions. La ejecución [40887908797](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions/runs/40887908797), sobre el commit `26908b07d179f3497eab293ebff354c4553774b5`, terminó con job `gameplay` en `success`: modelo/sintaxis, pruebas de navegador y subida del artefacto `cima-browser-evidence` aprobados. Esta ejecución verifica el código original en CI. La publicación y la comprobación pública posteriores se detallan a continuación.

## Publicación y prueba de producción completadas

URL: https://a-perfectstranger.github.io/arcos-eduardo-jueg-gr3/mi-primer-juego/

Commit publicado y probado: `399d0a90c1fb5a3e1b06040231c2b033a0576470`.

- [Pages 40891045012](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions/runs/40891045012): `success`.
- [CI 40891046099](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions/runs/40891046099): `success`.
- [Verify published CIMA 40891046139](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions/runs/40891046139): `success`, job `published-gameplay`.

Siete archivos públicos (HTML, CSS, tres módulos JS, Phaser y favicon) respondieron HTTP 200 y su SHA-256 coincidió con el checkout del código desplegado. La raíz respondió HTTP 200 y enlazó al juego. Chromium cargó el juego publicado y aprobó las 18 pruebas, incluida la victoria tras 25 saltos y la ausencia de errores JavaScript. La CDN se bloqueó deliberadamente para probar también el respaldo local servido por Pages.

Evidencia original: logs del job y artefacto `cima-production-evidence` (ID 12905245715), con JSON y capturas. Resumen persistente: `evidence/production.json`. Las pruebas se ejecutaron en el runner de CI; el executor de esta conversación no tiene acceso de red al dominio github.io. No se alteró su proxy.

La actualización final de documentación no modifica los archivos de ejecución del juego ni sus hashes. No quedan criterios de aceptación abiertos dentro del alcance acordado; se conservan los límites de navegadores y pruebas perceptuales indicados arriba.
