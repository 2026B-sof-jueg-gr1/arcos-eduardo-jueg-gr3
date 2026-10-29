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
| 7. Pruebas | Cumple en el alcance descrito | 5 pruebas Node y 18 comprobaciones de integración; sin errores JavaScript en la ejecución final. |
| 8. Push y Pages | Parcial: push confirmado; Pages pendiente | Commit 26908b0 subido a main y verificación remota aprobada. Pages aún desactivado; no hay despliegue público acreditado. |
| 9. Continuidad | Cumple | README, PLAN.md, VERIFICACION.md, ESTADO.md y evidencia JSON. |

## Resultados medidos

- Carga corta: altura máxima 29.25 px; carga completa: 177.39 px en Arcade.
- Caída intencional tras diez saltos: zona 2 → zona 1 (índices desde cero), contador de caídas = 1; aterrizaje a y=2280, sin reinicio de posición.
- Recorrido continuo final: 25 saltos, 0 caídas, victoria; aproximadamente 46.57 segundos simulados.
- Cada paso del recorrido se registra en `evidence/results.json`. El tiempo es de simulación de prueba, no una marca humana.

## Método y límites

Se usó Chromium real con renderizado, Phaser 3.90.0 y física Arcade. El harness detiene el reloj automático y avanza cuadros de 1/60 s para reproducir las entradas. El recorrido ganador envía eventos de teclado y no cambia posiciones, plataformas, gravedad ni velocidad. Las pruebas aisladas de pared y techo sí posicionan fixtures, separadas del recorrido.

La CDN se bloquea deliberadamente en esta suite para comprobar el respaldo local. Las capturas confirman el renderizado de escritorio y móvil. El registro del récord se comprueba en localStorage; almacenamiento inválido o denegado se prueba en Node. No se probaron Safari, Firefox ni un dispositivo móvil físico. El sonido y el modo pantalla completa están implementados, pero no cuentan con prueba de audio perceptual o de dispositivo. No hay una prueba de producción hasta que se active Pages y se confirme su respuesta y carga.

Para repetir, ver README. `.github/workflows/verify.yml` reproduce modelo, sintaxis y navegador en GitHub Actions. La ejecución [40887908797](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions/runs/40887908797), sobre el commit `26908b07d179f3497eab293ebff354c4553774b5`, terminó con job `gameplay` en `success`: modelo/sintaxis, pruebas de navegador y subida del artefacto `cima-browser-evidence` aprobados. Esto verifica el código en CI; Pages sigue siendo un criterio separado y pendiente.
