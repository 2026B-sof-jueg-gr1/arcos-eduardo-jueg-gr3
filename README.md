# CIMA — Un salto a la vez

Juego de precisión vertical inspirado en la mecánica de Jump King, desarrollado con **Phaser 3.90.0**. Cinco zonas conectadas, 25 plataformas, salto cargado y modo clásico sin checkpoints. Arte genérico original generado con formas; sin assets del juego original.

**Estado:** juego implementado y verificado localmente y en [GitHub Actions](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions/runs/40887908797). La publicación en GitHub Pages todavía requiere activación y comprobación; no se presenta como desplegado.

El proyecto vive en [`mi-primer-juego/`](mi-primer-juego/). El `index.html` raíz lleva al juego y `.nojekyll` permite servirlo como archivos estáticos.

## Ejecutar

Desde la raíz del repositorio:

```sh
python3 -m http.server 8080
```

Abrir http://localhost:8080/mi-primer-juego/. También se puede usar Live Server de VS Code. No abrir el HTML mediante `file://`: utiliza módulos JavaScript.

## Jugar

- Flechas izquierda/derecha o A/D: caminar en tierra y elegir dirección al despegar.
- Mantener espacio: cargar potencia; soltar espacio: saltar. Mantener izquierda/derecha al soltar para saltar en esa dirección; sin dirección, salto vertical.
- En el aire no se puede dirigir al personaje. Los laterales producen rebote.
- Esc: pausa/reanudar. R: reiniciar con confirmación. M: sonido.
- En pantallas táctiles: botones de dirección y mantener/soltar salto.
- Llegar a la plataforma de la corona completa la partida. Se guarda el mejor tiempo en este navegador; no se guarda una posición intermedia.

## Las cinco zonas

Pradera → Bosque → Ruinas → Cielo → Cumbre. Las plataformas se estrechan progresivamente. Una caída devuelve a plataformas inferiores; no hay checkpoints, vidas ni daño. El contador registra una caída cuando el descenso desde el punto más alto supera 190 píxeles sin aterrizar. El tiempo excluye las pausas.

## Verificar

```sh
npm --prefix mi-primer-juego test
pip install -r mi-primer-juego/tests/requirements.txt
python -m playwright install --with-deps chromium
```

Con el servidor HTTP iniciado, ejecutar las pruebas de navegador. Si Chromium no está en `/usr/bin/chromium`, indicar `CHROMIUM_PATH` con su ruta:

```sh
CHROMIUM_PATH=/ruta/a/chromium python3 mi-primer-juego/tests/browser.py
```

`CIMA_TEST_OUTPUT` permite elegir la carpeta de evidencias. `CIMA_URL` permite apuntar a otro servidor conservando la barra final. El modo `?qa=1` expone la escena para pruebas, no aparece en el enlace público normal. El recorrido de victoria usa entradas de teclado y la física real; no modifica las coordenadas del jugador. Las pruebas de paredes/techos usan fixtures aislados documentados.

[Plan y criterios](mi-primer-juego/docs/PLAN.md) · [Resultados y límites](mi-primer-juego/docs/VERIFICACION.md) · [Estado para continuar](mi-primer-juego/docs/ESTADO.md)

## GitHub Pages — según el taller

En [Settings → Pages](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/settings/pages), seleccionar:

1. Source: **Deploy from a branch**.
2. Branch: **main**, carpeta **/(root)**.
3. **Save**, esperar a que el workflow de Pages termine correctamente.

URL prevista, **pendiente de verificar**: https://a-perfectstranger.github.io/arcos-eduardo-jueg-gr3/mi-primer-juego/

Después de activar, comprobar que el enlace responde y cargar el juego en navegador, con sus scripts y assets. Una URL prevista o un push no acreditan el despliegue. La verificación automática del juego está en `.github/workflows/verify.yml`; la publicación la realiza el workflow que GitHub crea al activar Pages desde una rama.

## Archivos y dependencias

- `src/model.js`: reglas físicas, mapa y funciones puras.
- `src/game.js`: escena Arcade, gráficos genéricos, entradas, estados y HUD.
- `src/loader.js`: Phaser por CDN con respaldo local de la misma versión.
- `assets/vendor/`: Phaser y licencia MIT correspondiente.
- `tests/`: modelo y pruebas de integración Chromium.

No necesita compilación, cuentas, backend ni claves. El sonido se sintetiza con Web Audio después de una interacción. Phaser conserva su [licencia MIT](mi-primer-juego/assets/vendor/PHASER-LICENSE.md).
