# 🌐 Calculadora VLSM — ITM Redes LAN

> Herramienta web interactiva para diseño y análisis de planes de direccionamiento IP con VLSM (Variable Length Subnet Masking). Desarrollada como proyecto de la asignatura **Redes LAN** del Instituto Tecnológico Metropolitano (ITM).

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Guía de uso](#-guía-de-uso)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Algoritmo VLSM](#-algoritmo-vlsm)
- [Deploy](#-deploy)

---

## 📖 Descripción

La **Calculadora VLSM** permite diseñar planes de direccionamiento IP de forma visual e interactiva. Dada una red base y una lista de subredes con sus requisitos de hosts, la herramienta:

1. Ordena los requerimientos de mayor a menor para minimizar desperdicio
2. Asigna bloques alineados a potencias de 2 (condición VLSM)
3. Visualiza el resultado en tabla, mapa de bloques y árbol binario de división
4. Genera configuración Cisco IOS lista para copiar
5. Detecta solapamiento entre subredes ingresadas manualmente
6. Exporta el plan a CSV o PDF profesional

Además incluye herramientas educativas independientes: conversor de notaciones IP (decimal ↔ binario ↔ hex ↔ CIDR) y clasificador de IPs con base en los RFC de IANA.

---

## ✨ Funcionalidades

### 🔧 Calculadora VLSM principal
| Función | Descripción |
|---|---|
| **Motor VLSM** | Ordena subredes por hosts (mayor→menor), calcula prefijo mínimo, alinea bloques a potencias de 2 |
| **Validación en tiempo real** | IP base con indicador de clase (A/B/C) y tipo (privada/pública) mientras escribes |
| **Lista dinámica** | Agrega y elimina subredes requeridas con nombre y cantidad de hosts |
| **Historial** | Guarda los últimos 10 cálculos en `localStorage`; carga cualquiera con un clic |

### 📊 Visualizaciones
| Vista | Descripción |
|---|---|
| **Tabla de resultados** | Red, máscara, broadcast, primer host, último host, hosts útiles, pedidos, desperdicio |
| **Mapa visual** | Barra horizontal proporcional con segmentos coloreados y bloques libres marcados; tooltip al hacer hover |
| **Árbol binario** | División real del espacio de direcciones: cada bifurcación muestra cómo se parte el bloque en halvings sucesivos hasta llegar a cada subred asignada |

### 💡 Modo educativo
Al activar **"Modo educativo"** en la tabla, cada fila de subred despliega 5 tarjetas explicativas:
- Por qué ese prefijo (cálculo 2ⁿ)
- Cómo se obtienen los hosts útiles (total − 2)
- Por qué no alcanza el bloque anterior
- Análisis del desperdicio
- Significado de la máscara en binario

### 🖥 Cisco IOS + Simulador de ping
- Genera comandos `interface GigabitEthernetX`, `ip address`, `no shutdown` por cada subred
- **Ping simulator**: ingresa dos IPs y determina si están en la misma subred (comunicación directa) o requieren enrutamiento

### 📤 Exportación
| Formato | Método |
|---|---|
| **CSV** | Descarga directa compatible con Excel (UTF-8 con BOM) |
| **PDF** | Diálogo de impresión del navegador con estilos optimizados para papel |
| **Informe técnico** | Documento profesional tipo ingeniería: portada, resumen ejecutivo, diagrama SVG, tabla completa, comandos Cisco IOS y convenciones |

### 🔍 Detector de solapamiento
Herramienta independiente: ingresa subredes manualmente (red + prefijo) y detecta todos los pares que se superponen, mostrando los rangos exactos en conflicto.

### 🔢 Conversor de notaciones
Convierte en tiempo real entre:
- **Decimal**: `255.255.255.192`
- **Binario**: `11111111.11111111.11111111.11000000`
- **Hexadecimal**: `FF.FF.FF.C0`
- **CIDR**: `/26`

Incluye **visualización bit a bit** de los 32 bits con colores diferenciados para bits de red y bits de host.

### 🌐 Clasificador de IP
Ingresa cualquier dirección IPv4 y obtiene:
- Clase (A / B / C / D / E) con rango completo
- Tipo: Privada · Pública · Loopback · Link-local · Multicast · Broadcast · Documentación · Reservada
- Rango especial específico (ej. `192.168.0.0/16`)
- **RFC de referencia** con enlace directo al texto (RFC 1918, RFC 5735, RFC 3927, etc.)
- Representación binaria y nota educativa contextual

---

## 🛠 Tecnologías

| Tecnología | Uso |
|---|---|
| **React 18** | UI declarativa y gestión de estado con hooks |
| **Vite 5** | Build tool y dev server con HMR |
| **SVG nativo** | Árbol binario, mapa de bloques, diagrama del informe PDF |
| **CSS Custom Properties** | Theming dark/light sin dependencias externas |
| **localStorage** | Historial persistente de cálculos |
| **GitHub Pages / Vercel / Netlify** | Deploy estático |

**Sin dependencias de UI externas** — todo el motor y los visualizadores están implementados desde cero en JavaScript puro.

---

## 🚀 Instalación

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/vlsm-calculator.git
cd vlsm-calculator

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

### Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR
npm run build    # Build de producción en dist/
npm run preview  # Vista previa del build de producción
```

---

## 📖 Guía de uso

### 1. Calcular un plan VLSM

1. Ingresa la **IP base** de tu red (ej. `192.168.1.0`)
2. Selecciona el **prefijo** de la red base (ej. `/24`)
3. En la tabla de subredes, ingresa el **nombre** y la **cantidad de hosts** requeridos para cada segmento
4. Haz clic en **"Calcular VLSM"**
5. Explora los resultados en las diferentes pestañas:
   - **Tabla** — datos completos de cada subred
   - **Mapa Visual** — distribución proporcional del espacio IP
   - **Árbol Binario** — división jerárquica del bloque base
   - **Cisco IOS** — comandos de configuración + simulador de ping
   - **Exportar** — descarga en CSV
   - **Informe PDF** — documento técnico completo

### 2. Modo educativo

En la pestaña **Tabla**, activa el botón **"💡 Modo educativo"**. Aparecerá una columna con un botón `▼` en cada fila. Al hacer clic, se despliegan 5 tarjetas que explican cada valor de esa subred paso a paso.

### 3. Conversor de notaciones

En la sección **Herramientas educativas** (parte inferior de la página), selecciona la pestaña **🔢 Conversor de notaciones**. Escribe cualquier valor:
- Una IP decimal (`192.168.1.1`)
- Una máscara (`255.255.255.0`)
- Un prefijo CIDR (`/26` o `26`)
- Un valor binario (`11000000.10101000.00000001.00000000`)
- Un valor hexadecimal (`C0.A8.01.00`)

La conversión se actualiza en tiempo real.

### 4. Clasificador de IP

En la pestaña **🔍 Clasificador de IP**, escribe cualquier IPv4 y presiona **"Analizar"** o `Enter`. También puedes hacer clic en los ejemplos rápidos para probar distintos tipos de IP.

### 5. Generar informe PDF

Después de calcular, ve a la pestaña **Informe PDF** en los resultados. Completa los campos (nombre del proyecto, autor, institución) y haz clic en **"Generar informe PDF"**. Se abrirá una nueva ventana con el documento formateado; en el diálogo de impresión selecciona **"Guardar como PDF"**.

---

## 🗂 Estructura del proyecto

```
vlsm-calculator/
│
├── index.html                  # Punto de entrada HTML
├── vite.config.js              # Configuración de Vite
├── package.json
│
└── src/
    ├── main.jsx                # Bootstrap de React
    ├── App.jsx                 # Estado global y layout principal
    ├── styles.css              # Estilos globales (dark/light mode)
    │
    ├── engine/                 # Lógica de negocio (JS puro, sin dependencias)
    │   ├── vlsm.js             # Motor VLSM, validaciones, CSV
    │   ├── ipInfo.js           # Clasificación de IPs y base de datos RFC
    │   └── notation.js         # Conversiones decimal/binario/hex/CIDR
    │
    └── components/
        ├── InputPanel.jsx      # Formulario de entrada (IP, prefijo, subredes)
        ├── ResultsTable.jsx    # Tabla de resultados + modo educativo
        ├── BlockBar.jsx        # Mapa visual proporcional (SVG/div)
        ├── SubnetTree.jsx      # Árbol binario de división (SVG)
        ├── CiscoPanel.jsx      # Comandos IOS + simulador de ping
        ├── ExportPanel.jsx     # Exportación CSV e impresión PDF
        ├── DocGenerator.jsx    # Generador de informe técnico PDF
        ├── OverlapChecker.jsx  # Detector de solapamiento manual
        ├── NotationConverter.jsx  # Conversor de notaciones + bits
        └── IPClassifier.jsx    # Clasificador de IP con RFC lookup
```

---

## ⚙ Algoritmo VLSM

El motor VLSM implementado en [`src/engine/vlsm.js`](src/engine/vlsm.js) sigue estos pasos:

### 1. Validación y normalización
```
IP base "192.168.1.5" con /24  →  red normalizada: 192.168.1.0/24
```

### 2. Ordenamiento de requerimientos
```
Entrada:  [WAN=2, LAN-B=30, LAN-A=50]
Ordenado: [LAN-A=50, LAN-B=30, WAN=2]   ← mayor a menor
```

### 3. Cálculo de prefijo mínimo
Para cada subred se busca el mínimo prefijo `p` tal que `2^(32−p) − 2 ≥ hosts`:

| Hosts requeridos | Cálculo | Prefijo asignado | Hosts útiles |
|---|---|---|---|
| 50 | 2^6 − 2 = 62 ≥ 50 | /26 | 62 |
| 30 | 2^5 − 2 = 30 ≥ 30 | /27 | 30 |
| 2  | 2^2 − 2 = 2  ≥ 2  | /30 | 2  |

### 4. Asignación con alineación
El cursor se alinea al próximo múltiplo del tamaño del bloque antes de asignar:
```
cursor = 192.168.1.0
  → LAN-A /26 (tamaño 64): alineado a .0  → asigna .0   → cursor .64
  → LAN-B /27 (tamaño 32): alineado a .64 → asigna .64  → cursor .96
  → WAN   /30 (tamaño 4):  alineado a .96 → asigna .96  → cursor .100
```

### 5. Resultado
| Subred | Red        | Máscara           | Broadcast     | Hosts útiles |
|--------|------------|-------------------|---------------|--------------|
| LAN-A  | 192.168.1.0/26  | 255.255.255.192 | 192.168.1.63  | 62 |
| LAN-B  | 192.168.1.64/27 | 255.255.255.224 | 192.168.1.95  | 30 |
| WAN    | 192.168.1.96/30 | 255.255.255.252 | 192.168.1.99  | 2  |

---

## 🌐 Deploy

### GitHub Pages
```bash
npm run build
# Sube el contenido de dist/ a la rama gh-pages
```

### Vercel (recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
Arrastra la carpeta `dist/` al dashboard de Netlify, o conecta el repositorio de GitHub para deploy automático en cada push.

---

## 📄 Licencia

MIT © 2025 — ITM Redes LAN
