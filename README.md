# CIMA

[Jugar en GitHub Pages](https://a-perfectstranger.github.io/arcos-eduardo-jueg-gr3/mi-primer-juego/)

Juego de precisión vertical inspirado en Jump King, desarrollado con Phaser 3.90.0 y gráficos genéricos. Cinco zonas conectadas, 25 plataformas y una corona en la cima. La página muestra únicamente el juego a tamaño de ventana, con sus controles y marcadores integrados.

## Cómo jugar

- **← / → o A / D:** caminar en tierra y elegir la dirección del salto.
- **Espacio:** mantener para cargar potencia y soltar para saltar. Mantén una dirección al soltar para saltar hacia ese lado; sin dirección, saltas verticalmente.
- La dirección queda fijada al despegar: no hay control aéreo. Las paredes laterales producen rebote.
- **Esc:** pausar o continuar. **R:** reiniciar con confirmación. **M:** activar o silenciar sonido.
- En móvil, utiliza las flechas y mantén/suelta **SALTAR**. El botón ⛶ permite ocultar también la interfaz del navegador cuando este lo admite.

Sube por **Pradera → Bosque → Ruinas → Cielo → Cumbre**. Las plataformas se estrechan progresivamente. No hay checkpoints, vidas ni daño: una caída puede devolverte a zonas anteriores. El contador registra una caída al descender más de 190 píxeles sin aterrizar. El tiempo excluye las pausas.

Aterrizar junto a la corona completa la partida. El mejor tiempo se guarda en este navegador; la posición no se guarda.

## Ejecutar localmente

Desde la raíz del repositorio:

```sh
python3 -m http.server 8080
```

Abre http://localhost:8080/mi-primer-juego/. También puedes usar Live Server en VS Code. Se necesita un servidor HTTP porque el juego utiliza módulos JavaScript.

## Pruebas y despliegue

```sh
npm --prefix mi-primer-juego test
pip install -r mi-primer-juego/tests/requirements.txt
python -m playwright install --with-deps chromium
CHROMIUM_PATH=/ruta/a/chromium python3 mi-primer-juego/tests/browser.py
```

Las pruebas de navegador requieren el servidor local activo. Por defecto se busca Chromium en `/usr/bin/chromium`. `CIMA_TEST_OUTPUT` selecciona la carpeta de evidencias; `CIMA_URL` permite probar otra URL con barra final. `?qa=1` expone la escena para pruebas; el recorrido ganador usa entradas de teclado y física real, sin modificar la posición del personaje.

Pages publica desde **main / (root)**. El HTML raíz lleva a `mi-primer-juego/`. GitHub Actions comprueba el modelo, el recorrido y los archivos públicos. Los resultados y capturas se conservan como artefactos de [las ejecuciones](https://github.com/A-PerfectStranger/arcos-eduardo-jueg-gr3/actions).

La verificación cubre Chromium de escritorio y emulación táctil; no se ha probado en Safari, Firefox ni móvil físico.

## Código

El juego está en `mi-primer-juego/`: `src/model.js` contiene física y mapa; `src/game.js`, escena y controles; `src/loader.js`, carga de Phaser por CDN con respaldo local. No necesita compilación, backend, cuentas ni claves. Phaser conserva su [licencia MIT](mi-primer-juego/assets/vendor/PHASER-LICENSE.md).

La explicación se mantiene únicamente en este README; se eliminó la carpeta de documentación adicional. Para continuar el desarrollo, revisar el remoto y el resultado de los workflows antes de editar.
