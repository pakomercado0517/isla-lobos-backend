# Guía para Desinstalar pnpm Completamente

## Pasos para Desinstalar pnpm

### 1. Desinstalar de npm (si está instalado globalmente)
```bash
npm uninstall -g pnpm
```

### 2. Eliminar la instalación standalone de pnpm
La instalación está en: `C:\Users\sissy\AppData\Local\pnpm\`

**Opción A: Desde PowerShell (como Administrador)**
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\pnpm"
```

**Opción B: Manualmente**
1. Abre el Explorador de Windows
2. Ve a: `C:\Users\sissy\AppData\Local\`
3. Busca la carpeta `pnpm` y elimínala completamente

### 3. Limpiar variables de entorno PATH
1. Abre "Variables de entorno" en Windows
2. Busca en "Variables del sistema" → "Path"
3. Elimina cualquier entrada relacionada con pnpm (generalmente `%LOCALAPPDATA%\pnpm`)

### 4. Cerrar y reabrir la terminal
Cierra todas las terminales y vuelve a abrirlas para que los cambios surtan efecto.

### 5. Verificar que pnpm está desinstalado
```bash
pnpm --version
# Debería dar error: "command not found"
```

## Reinstalar pnpm con la versión correcta

### Opción 1: Usando Corepack (Recomendado - viene con Node.js)
```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

### Opción 2: Usando npm
```bash
npm install -g pnpm@9.15.9
```

### Opción 3: Usando el instalador standalone
```bash
# PowerShell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### Verificar instalación
```bash
pnpm --version
# Debería mostrar: 9.15.9
```


