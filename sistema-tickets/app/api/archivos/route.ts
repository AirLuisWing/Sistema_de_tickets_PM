import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { obtenerSesion } from '@/lib/session';

export async function GET(req: NextRequest) {
  // 🛡️ SEGURIDAD 1: Solo usuarios logueados pueden ver o descargar evidencias
  const sesion = await obtenerSesion();
  if (!sesion) {
    return new NextResponse('Acceso denegado', { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const ruta = searchParams.get('path'); 

  if (!ruta) {
    return new NextResponse('Ruta no proporcionada', { status: 400 });
  }

  try {
    // Le quitamos el slash inicial si lo trae para evitar problemas de rutas relativas
    const rutaLimpia = ruta.startsWith('/') ? ruta.slice(1) : ruta;
    
    // Calculamos la ruta absoluta final que el usuario está intentando leer
    const filePath = path.join(process.cwd(), 'public', rutaLimpia);
    
    // Definimos nuestra "JAULA" (La única carpeta desde donde es legal leer archivos)
    const allowedDirectory = path.join(process.cwd(), 'public', 'uploads');

    // 🛡️ BLINDAJE ANTI PATH TRAVERSAL: 
    // Verificamos que, después de que Node resuelva todos los "../", 
    // la ruta resultante siga estando estrictamente dentro de la "jaula" de uploads.
    if (!filePath.startsWith(allowedDirectory)) {
      console.warn(`[ALERTA DE SEGURIDAD] Intento de Path Traversal bloqueado. Usuario ID: ${sesion.userId}, Ruta intentada: ${ruta}`);
      return new NextResponse('Acceso denegado. Intento de vulneración detectado.', { status: 403 });
    }

    // Leemos el archivo físico en vivo
    const fileBuffer = await readFile(filePath);

    // Asignamos el formato correcto
    let mimeType = 'application/octet-stream';
    if (filePath.endsWith('.webp')) mimeType = 'image/webp';
    else if (filePath.endsWith('.png')) mimeType = 'image/png';
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (filePath.endsWith('.pdf')) mimeType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': filePath.endsWith('.pdf') ? `inline; filename="${path.basename(filePath)}"` : 'inline',
      },
    });
  } catch (error) {
    console.error("[API Archivos] Error al leer el archivo:", error);
    return new NextResponse('Archivo no encontrado en el disco.', { status: 404 });
  }
}