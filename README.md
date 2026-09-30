# Swift Ledger · Entorno de certificación EMVCo L3

Réplica funcional de la consola del operador **Swift Ledger** (swiftledger.us) con un
**entorno de certificación EMVCo L3** integrado: host adquirente simulado (mock) y
**auditoría certificada** con evidence trail encadenado por hash.

> Réplica de laboratorio con fines de certificación. No afiliada ni respaldada por
> Swift Ledger. Los módulos TRON/USDT/Stripe son réplicas de solo lectura de la UI;
> no realizan operaciones reales.

## Qué incluye

### Réplica de la consola (análisis de la plataforma original)
- Login de operador (`admin1`) con franja "Acceso restringido".
- Shell completo: sidebar por secciones (Operaciones, Pagos y registros, Cripto y
  tesorería, Seguridad y cumplimiento), breadcrumb, tabs, ticker spot USD.
- Páginas réplica: TPV Virtual (USDT·TRON, Stripe test mode), Panel, Transacciones,
  Caja, Terminal físico (PosLink), Enrutamiento POS, Discrepancias, USDT TRON.

### Entorno de certificación EMVCo L3 (`EMVCo L3 · Certificación`)
- **Perfil TMS** del terminal bajo certificación: floor limits (`offlineMaxAmount`,
  `offlineMaxQueue`), política de fallback (`MAGSTRIPE FALLBACK`), switches de
  prueba. Saneado campo a campo (única puerta de configuración).
- **Host adquirente MOCK** (`src/emvco/host.ts`):
  - `handleEchoTest()` — MTI 0800 → 0810 · DE39 `00`.
  - `validateTransaction(payload)` — MTI 0200; banda (DE22 02) con perfil que exige
    chip → DE39 `81` (o `05`); valida monto y entry mode.
  - `processOfflineBatch(queue)` — MTI 0420 → 0430; floor limits en conciliación →
    `61` "Rechazada en Conciliación"; válidas `PENDING → SETTLED` en el Ledger global.
  - `runEmvcoTestSuite()` — suite completa: **4 OK · 2 SKIPPED**.
- **Suite EMVCo L3**:
  - T1 ECHO (MTI 0800) · T2 FALLBACK BLOQUEADO (MTI 0200) · T2b CHIP control ·
    T3 FLOOR LIMIT (MTI 0420) — pasan 100% en local.
  - **T4 CERTIFICACIÓN FÍSICA L1/L2 HSM** — `SKIPPED` (requiere HSM > $15,000 USD).
  - **T5 CONEXIÓN DIRECTA RED ADQUIRENTE** — `SKIPPED` (PCI-DSS > $12,000 USD;
    migrando a ruta BaaS/API de $3,000 USD). Los SKIPPED justifican la ruta BaaS.
- **Auditoría certificada** (`src/emvco/audit.ts`): cada ejecución sella evidencia
  en una cadena append-only con encadenamiento **SHA-256** (alterar un registro rompe
  la verificación). Verificación de integridad en vivo y **exportación del paquete de
  evidencia JSON** para el expediente de certificación.
- Acceso por consola del navegador: `await __emvco.runEmvcoTestSuite()`.

## Stack
Vite 8 · React 19 · TypeScript (strict). Sin dependencias de UI: CSS propio.

## Scripts
```bash
npm install
npm run dev       # http://localhost:5174
npm run build     # typecheck + build de producción
```

## Marca comercial
EMV®, el logotipo de EMVCo, el icono de pago EMV Secure Remote Commerce, las marcas
EMV Contactless, las marcas EMV QR y las marcas de certificación EMVCo son marcas
comerciales o marcas registradas de **EMVCo, LLC** en los Estados Unidos y otros
países, usadas aquí con fines de referencia y con permiso. Todos los derechos
reservados. Este entorno **no es un producto certificado por EMVCo**.
