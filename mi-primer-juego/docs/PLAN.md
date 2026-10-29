# CIMA — alcance y plan aceptado

Fecha: 2026-10-29. Repositorio: A-PerfectStranger/arcos-eduardo-jueg-gr3.
Antes de implementar: `git fetch --prune origin`; HEAD y origin/main en d2e7643. Árbol limpio.
Usuario confirmó modo clásico sin checkpoints y uso del repositorio personal disponible.

## Criterios de aceptación

1. Proyecto contenido en mi-primer-juego; index.html, game.js y Phaser 3 fijado; assets genéricos sin dependencias gráficas externas.
2. Movimiento a izquierda/derecha en tierra, salto con potencia proporcional a la carga, dirección fijada al despegar y ausencia de control aéreo.
3. Cinco zonas de dificultad creciente conectadas; recorrido completo hasta la corona físicamente alcanzable.
4. Colisiones sólidas, gravedad, rebote lateral y caída a zonas anteriores sin checkpoints; cámara sigue al jugador.
5. Inicio, pausa/reanudar, reinicio confirmado, victoria y nueva partida sin estado residual. Pérdida de foco pausa y libera entradas.
6. Interfaz española, controles documentados, teclado y controles táctiles, adaptación a pantalla, contador de saltos/caídas/tiempo y mejor tiempo local.
7. Verificación automatizada de reglas y navegador real: controles, colisiones, recorrido, victoria y ciclo de partida; límites de pruebas declarados.
8. Push sin sobrescribir cambios remotos y despliegue público en GitHub Pages comprobado. No confundir configuración con publicación.
9. README, matriz de verificación y estado final reproducible para otra sesión.

## Etapas

A. Modelo físico, mapa y escena jugable. Validar trayectoria y alcance.
B. Arte genérico, interfaz, estados de partida, audio y entradas. Validar ciclo completo.
C. Pruebas unitarias y navegador Chromium real; corregir fallos y recorrer las cinco zonas.
D. Revisión final del remoto, commit/push, activación y comprobación de Pages. Registrar evidencia y bloqueos reales.

## Relación con el PDF

El PDF es material de referencia: pide crear repositorio público, carpeta mi-primer-juego, index.html con Phaser por CDN, game.js, cámara, flechas, prueba local, commit/push y Pages desde main /(root).
El repositorio ya existe y el usuario confirmó utilizarlo, por lo que no se crea otro ni se mueve a la organización del curso.
Se mantiene el flujo sin compilación; respaldo local de Phaser para cuando falle CDN.
La publicación en Teams y comentar a dos compañeros son instrucciones académicas del documento, no acciones solicitadas en esta conversación. No se envían mensajes a terceros.
