---
name: openai-product-ad-generation
description: Proceso obligatorio para generar imágenes publicitarias con el motor OpenAI (gpt-image-2/gpt-image-1) preservando el producto real del usuario y aplicando el estilo de una imagen de referencia. Usar SIEMPRE que se toque, modifique, depure o revise el archivo aiImages.js (o equivalente) del proyecto Antigravity, especialmente cualquier código relacionado con generación de imágenes publicitarias, endpoints de OpenAI Images, "image edits", "image generations", preservación de producto, transferencia de estilo desde imagen de referencia, o reportes de que "el producto cambia" / "no respeta el producto real" / "no toma el estilo de la referencia". No usar para la rama de Kie.ai / Flux Kontext, que tiene su propio mecanismo correcto vía inputImage y no debe modificarse bajo este proceso.
---

# Generación de imágenes publicitarias preservando el producto real (motor OpenAI)

## Por qué existe esta skill

Este proyecto (Antigravity) genera imágenes publicitarias a partir de fotos reales
de producto + una imagen de referencia de estilo. Hubo un bug de fondo ya
diagnosticado y corregido una vez: usar el endpoint equivocado de OpenAI hace que
el modelo **invente** un producto en vez de preservar el real. Esta skill existe
para que ese bug (o variantes de él) no se reintroduzcan, y para guiar la
corrección del problema siguiente: que el estilo de la imagen de referencia se
aplique de verdad.

**Regla de oro que nunca se debe romper:** el producto real del usuario es
inmutable y tiene prioridad absoluta sobre cualquier otra instrucción. La imagen
de referencia SOLO aporta estilo/composición, nunca contenido del producto.

---

## Diagnóstico rápido (leer primero)

Antes de tocar código, identifica en qué etapa está el bug:

| Síntoma reportado | Causa más probable | Ir a sección |
|---|---|---|
| "El producto sale distinto / cambiado / inventado" | Se está usando `/v1/images/generations` (texto→imagen) en vez de `/v1/images/edits` (imagen→imagen) | [Paso 1](#paso-1-endpoint-correcto-no-negociable) |
| "El producto ya sale bien, pero el estilo/fondo/composición de la referencia no se aplica" | La imagen de referencia se manda sin jerarquía clara, o el prompt no le da instrucciones positivas suficientes para copiarla | [Paso 2](#paso-2-hacer-que-la-referencia-de-estilo-se-aplique) |
| Error 400 inesperado en el backend | Falta `productImage` en el request (validación correcta, no es bug) | [Paso 3](#paso-3-validación-frontend) |
| `form-data is not defined` / import error | Falta la dependencia npm | [Paso 4](#paso-4-dependencias) |

---

## Paso 1: Endpoint correcto (NO NEGOCIABLE)

La generación de anuncios con el motor OpenAI **siempre** debe usar:

```
POST https://api.openai.com/v1/images/edits
```

**Nunca** `https://api.openai.com/v1/images/generations` para este flujo. Ese
endpoint solo acepta texto, no puede recibir las fotos del producto, y por lo
tanto el modelo improvisa un producto nuevo a partir de la descripción —
exactamente el bug original de esta skill.

Reglas del endpoint `/edits`:
- Requiere `multipart/form-data`, no JSON.
- Las imágenes van como archivos binarios en el campo `image[]` (hasta 16 imágenes).
- Modelos válidos: `gpt-image-2` (preferido) con fallback a `gpt-image-1`.
  `dall-e-3` está retirado y no debe usarse.
- Tamaños fijos válidos: `1024x1024`, `1536x1024` (horizontal/16:9), `1024x1536` (vertical/9:16).
- `gpt-image-2` aplica alta fidelidad a las imágenes de entrada automáticamente;
  no requiere el parámetro `input_fidelity`.

Antes de generar el form-data, **siempre** descargar cada imagen (URL o
data-URL base64) a un `Buffer` real. Nunca enviar URLs como texto plano dentro
del campo `image[]`; el campo espera el archivo binario adjunto.

Verificación de que este paso está bien hecho: si lees el código y ves que
`generateOpenAIImage` (o su equivalente) construye un objeto JSON con
`{ model, prompt, n, size }` y lo manda con `Content-Type: application/json`,
**eso es el bug**. Debe construir un `FormData` y mandarlo con
`form.getHeaders()`.

---

## Paso 2: Hacer que la referencia de estilo se aplique

Una vez el producto real se preserva correctamente (Paso 1 resuelto), el
problema típico siguiente es que el modelo **ignora o aplica débilmente** el
estilo de la imagen de referencia. Esto pasa por dos razones combinadas, y
ambas deben corregirse juntas:

### 2.1 Orden y etiquetado explícito de las imágenes

Cuando se adjuntan varias imágenes en `image[]`, el modelo no sabe por contexto
cuál es "el producto" y cuál es "la referencia de estilo" — solo lo sabe si el
prompt lo dice explícitamente por posición. El prompt debe enumerar las
imágenes adjuntas en el mismo orden en que se mandan, por ejemplo:

```
Imagen 1: producto real a preservar exactamente.
Imagen 2 (si existe): vista adicional del mismo producto real.
Imagen N (la última adjunta): SOLO referencia de estilo/composición a imitar,
NO es el producto.
```

El orden de envío recomendado es: todas las imágenes de producto primero,
imagen de referencia al final — y el prompt debe decir expresamente "la última
imagen adjunta" al referirse a la referencia, para que no haya ambigüedad.

### 2.2 Instrucciones POSITIVAS y obligatorias sobre la referencia

No basta con decirle al modelo qué NO debe copiar de la referencia (eso ya
debe estar — forma, colores, logo, materiales del producto). Hace falta una
lista igual de explícita de **qué SÍ debe copiar, casi exactamente**:

- composición exacta y encuadre de cámara
- ángulo y altura de cámara
- tipo y dirección de la iluminación
- sombras y reflejos
- paleta de colores del fondo/ambiente (nunca del producto)
- estilo de fondo (estudio, exteriores, props, etc.)
- mood / atmósfera general del anuncio
- composición tipográfica o espacios vacíos, si aplica

Frase obligatoria a incluir en el prompt (adaptar según redacción, pero el
contenido debe estar siempre presente):

> "Tu tarea principal es RECREAR la escena de la imagen de referencia casi
> exactamente, solo sustituyendo el objeto/producto que aparece en ella por el
> producto real de las primeras imágenes adjuntas. Trata la imagen de
> referencia como un storyboard obligatorio a seguir, no como una sugerencia
> opcional."

### 2.3 Si después de 2.1 y 2.2 la fidelidad de estilo sigue siendo floja

Esto es una limitación conocida de `gpt-image-1`/`gpt-image-2` en modo edición:
no son modelos de transferencia de estilo tan precisos como Flux Kontext.
Si el resultado sigue sin respetar bien la referencia tras aplicar 2.1 y 2.2:

1. Probar invertir el orden de envío (referencia primero, producto después)
   SOLO si no rompe la preservación del producto ya lograda en el Paso 1.
   Probar como experimento controlado, no como cambio definitivo sin validar.
2. Si sigue sin funcionar bien, la alternativa de fondo es replicar para esta
   rama el mismo patrón que ya funciona correctamente en la rama Kie.ai
   (Flux Kontext), que usa un parámetro nativo `inputImage` diseñado
   específicamente para este tipo de transferencia de composición/estilo
   manteniendo fijo un objeto. No modificar esa rama Kie.ai; solo usarla como
   referencia de patrón si hay que migrar la lógica de estilo.
3. Cualquier cambio de este tipo (Paso 2.3) debe proponerse al usuario antes
   de aplicarlo — no es un fix automático, es una decisión de producto.

---

## Paso 3: Validación frontend

El backend valida (correctamente) que `productImage` esté presente cuando el
motor seleccionado es `"openai"`, devolviendo error 400 si falta. Esto es
intencional y NO debe removerse ni debilitarse en el backend.

El frontend debe evitar que ese 400 ocurra, validando antes de enviar:

- Si el motor seleccionado es `"openai"`, el campo de imagen de producto es
  obligatorio para habilitar el botón de generar / enviar el formulario.
- Si el usuario intenta generar sin imagen de producto con motor `"openai"`,
  mostrar un mensaje claro en la UI (ej. "Debes subir al menos una imagen del
  producto para usar el motor OpenAI") y bloquear el envío.
- No aplicar esta restricción a la rama `"kie-ai"` si esa rama maneja la
  ausencia de imagen de otra forma (confirmar con el código existente antes
  de asumir paridad de reglas entre motores).

---

## Paso 4: Dependencias

El endpoint `/v1/images/edits` requiere construir `multipart/form-data` desde
Node.js. Se usa la librería `form-data` (no `FormData` nativo de algunos
runtimes, que no soporta adjuntar Buffers con metadata de archivo de la misma
forma en Node).

Verificar que `package.json` del backend incluya:

```json
"form-data": "^4.0.0"
```

Si no está, instalarla:

```bash
npm install form-data
```

Y confirmar que el import en el archivo de generación sea:

```js
import FormData from 'form-data';
```

---

## Checklist final antes de dar por resuelto el flujo OpenAI

Recorrer esta lista completa, no detenerse en el primer punto que parezca correcto:

- [ ] La llamada usa `https://api.openai.com/v1/images/edits`, nunca `/generations`.
- [ ] El request se manda como `multipart/form-data` con `form.getHeaders()`, nunca como JSON.
- [ ] Cada imagen (producto y referencia) se descarga a `Buffer` real antes de adjuntarla; nunca se manda una URL como texto dentro de `image[]`.
- [ ] Las imágenes de producto van primero en `image[]`, la referencia va al final.
- [ ] El prompt identifica explícitamente, por posición, cuál imagen es el producto y cuál es la referencia.
- [ ] El prompt tiene instrucciones negativas (qué NO tomar del producto de la referencia) Y positivas (qué SÍ tomar de la referencia: composición, luz, sombras, fondo, mood).
- [ ] El modelo usado es `gpt-image-2` con fallback a `gpt-image-1`; nunca `dall-e-3`.
- [ ] El tamaño (`size`) enviado es uno de los tres tamaños fijos válidos según el `ratio` solicitado.
- [ ] El backend devuelve error 400 claro si falta `productImage` para el motor `openai`.
- [ ] El frontend bloquea el envío antes de llegar a ese 400, con mensaje explicativo al usuario.
- [ ] `form-data` está en las dependencias del backend y el import es correcto.
- [ ] La rama Kie.ai / Flux Kontext (`inputImage`) no fue tocada ni modificada por este proceso.

Si algún punto falla, corregirlo siguiendo el paso correspondiente arriba antes
de considerar el flujo terminado.
