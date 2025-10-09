import axios from "axios";
import zlib from "zlib";
import { promisify } from "util";
import {
  SMNDatosDiarios,
  SMNDatosHorarios,
  SMNConfiguracionRegion,
  EstadoPuerto,
} from "../types";

const gunzip = promisify(zlib.gunzip);

/**
 * SMNService - Servicio para integración con API del Servicio Meteorológico Nacional (CONAGUA)
 *
 * Funcionalidades:
 * - Obtención de datos meteorológicos del SMN
 * - Conversión de datos a formato CondicionMeteorologica
 * - Filtrado por región (estado/municipio)
 * - Estimación de condiciones marítimas
 */
class SMNService {
  private static readonly BASE_URL =
    "https://smn.conagua.gob.mx/tools/GUI/webservices/";
  private static readonly TIMEOUT = 30000; // 30 segundos

  /**
   * Configuración para Isla de Lobos (Norte de Veracruz)
   *
   * IMPORTANTE: Isla de Lobos está en Veracruz, no en Quintana Roo
   * - Estado: Veracruz (ID: 30)
   * - Municipios cercanos:
   *   - Tuxpan: ID 189
   *   - Tamiahua: ID 156
   */
  private static readonly REGION_ISLA_LOBOS: SMNConfiguracionRegion = {
    estado_id: "30", // Veracruz
    municipio_id: "189", // Tuxpan (municipio más cercano a Isla de Lobos)
    nombre_region: "Veracruz - Tuxpan (Isla de Lobos)",
  };

  /**
   * Obtener pronóstico por día (hasta 3 días)
   * Endpoint: method=1 (PronosticoPorMunicipiosGZ)
   */
  static async getPronosticoDiario(): Promise<SMNDatosDiarios[]> {
    try {
      console.log("📡 Obteniendo pronóstico diario del SMN...");

      const response = await axios.get(`${this.BASE_URL}?method=1`, {
        responseType: "arraybuffer",
        timeout: this.TIMEOUT,
        headers: {
          "Accept-Encoding": "gzip",
        },
      });

      // Descomprimir gzip
      const decompressed = await gunzip(response.data);
      const jsonData = JSON.parse(decompressed.toString());

      console.log(
        `✅ Pronóstico diario obtenido: ${jsonData.length || 0} registros`
      );

      return Array.isArray(jsonData) ? jsonData : [];
    } catch (error) {
      console.error("❌ Error al obtener pronóstico diario del SMN:", error);
      throw new Error(
        "No se pudo obtener el pronóstico diario del SMN. Verifique la conexión o intente más tarde."
      );
    }
  }

  /**
   * Obtener pronóstico por hora (hasta 48 horas)
   * Endpoint: method=3 (PronosticoPorMunicipios48HrsGZ)
   */
  static async getPronosticoHorario(): Promise<SMNDatosHorarios[]> {
    try {
      console.log("📡 Obteniendo pronóstico horario del SMN...");

      const response = await axios.get(`${this.BASE_URL}?method=3`, {
        responseType: "arraybuffer",
        timeout: this.TIMEOUT,
        headers: {
          "Accept-Encoding": "gzip",
        },
      });

      // Descomprimir gzip
      const decompressed = await gunzip(response.data);
      const jsonData = JSON.parse(decompressed.toString());

      console.log(
        `✅ Pronóstico horario obtenido: ${jsonData.length || 0} registros`
      );

      // Log de muestra de los primeros datos para debugging
      if (jsonData.length > 0) {
        console.log(
          "🔍 Muestra del primer registro:",
          JSON.stringify(jsonData[0], null, 2)
        );
        console.log(
          "🔍 Campos disponibles:",
          Object.keys(jsonData[0]).join(", ")
        );
      }

      return Array.isArray(jsonData) ? jsonData : [];
    } catch (error) {
      console.error("❌ Error al obtener pronóstico horario del SMN:", error);
      throw new Error(
        "No se pudo obtener el pronóstico horario del SMN. Verifique la conexión o intente más tarde."
      );
    }
  }

  /**
   * Filtrar datos por región específica
   */
  static filtrarPorRegion<T extends SMNDatosDiarios | SMNDatosHorarios>(
    datos: T[],
    estadoId: string,
    municipioId?: string
  ): T[] {
    return datos.filter((d) => {
      if (municipioId) {
        return d.ides === estadoId && d.idmun === municipioId;
      }
      return d.ides === estadoId;
    });
  }

  /**
   * Filtrar datos para la región de Isla de Lobos
   */
  static filtrarPorIslaLobos<T extends SMNDatosDiarios | SMNDatosHorarios>(
    datos: T[]
  ): T[] {
    return this.filtrarPorRegion(
      datos,
      this.REGION_ISLA_LOBOS.estado_id,
      this.REGION_ISLA_LOBOS.municipio_id
    );
  }

  /**
   * Convertir datos del SMN a formato CondicionMeteorologica
   */
  static convertirACondicionMeteorologica(
    dato: SMNDatosHorarios | SMNDatosDiarios
  ): {
    fecha_hora: Date;
    oleaje: number;
    viento_velocidad: number;
    viento_direccion: string;
    visibilidad: string;
    estado_puerto: EstadoPuerto;
    prediccion_5_dias: string;
    fuente: string;
  } {
    // Determinar si es dato horario (hloc) o diario (dloc)
    const fechaString =
      "hloc" in dato ? dato.hloc : "dloc" in dato ? dato.dloc : undefined;

    // Validar que existan los campos esenciales
    if (!fechaString) {
      throw new Error(
        `Campo 'hloc' o 'dloc' no encontrado en dato. Campos disponibles: ${Object.keys(
          dato
        ).join(", ")}`
      );
    }

    if (!dato.velvien) {
      throw new Error("Campo 'velvien' (velocidad del viento) no encontrado");
    }

    const vientoVelocidad = parseFloat(dato.velvien);

    // Para datos horarios no hay campo 'cc' (cobertura de nubes), solo está en diarios
    const coberturaNubes = "cc" in dato && dato.cc ? parseFloat(dato.cc) : 0;
    const probabilidadPrecipitacion = parseFloat(dato.probprec || "0");

    // Validar que los números sean válidos
    if (isNaN(vientoVelocidad)) {
      throw new Error(`Velocidad del viento inválida: ${dato.velvien}`);
    }

    // Determinar condiciones
    const visibilidad = this.determinarVisibilidad(
      coberturaNubes,
      probabilidadPrecipitacion
    );
    const oleaje = this.estimarOleaje(vientoVelocidad);
    const estadoPuerto = this.determinarEstadoPuerto(vientoVelocidad, oleaje);

    // Construir predicción descriptiva
    const prediccion = this.construirPrediccion(dato);

    return {
      fecha_hora: this.parsearFecha(fechaString),
      oleaje,
      viento_velocidad: vientoVelocidad,
      viento_direccion: this.normalizarDireccion(dato.dirvienc),
      visibilidad,
      estado_puerto: estadoPuerto,
      prediccion_5_dias: prediccion,
      fuente: "CONAGUA",
    };
  }

  /**
   * Parsear fecha del formato del SMN (YYYYmmddTHH)
   */
  private static parsearFecha(dloc: string): Date {
    // Formato: YYYYmmddTHH (ejemplo: "20250926T14")
    const year = parseInt(dloc.substring(0, 4));
    const month = parseInt(dloc.substring(4, 6)) - 1; // Los meses en JS son 0-11
    const day = parseInt(dloc.substring(6, 8));
    const hour = parseInt(dloc.substring(9, 11));

    return new Date(year, month, day, hour, 0, 0);
  }

  /**
   * Normalizar dirección del viento a formato abreviado
   */
  private static normalizarDireccion(direccion: string): string {
    const mapa: Record<string, string> = {
      Norte: "N",
      Noreste: "NE",
      Este: "E",
      Sureste: "SE",
      Sur: "S",
      Suroeste: "SW",
      Oeste: "W",
      Noroeste: "NW",
    };

    return mapa[direccion] || direccion.substring(0, 2).toUpperCase();
  }

  /**
   * Estimar oleaje basado en velocidad del viento
   * Fórmula simplificada: Escala de Beaufort adaptada
   */
  private static estimarOleaje(vientoVelocidad: number): number {
    if (vientoVelocidad < 10) return 0.5; // Calma/brisa ligera
    if (vientoVelocidad < 20) return 1.0; // Brisa moderada
    if (vientoVelocidad < 30) return 1.8; // Viento fresco
    if (vientoVelocidad < 40) return 2.5; // Viento fuerte
    if (vientoVelocidad < 50) return 3.5; // Temporal
    return 5.0; // Temporal fuerte o superior
  }

  /**
   * Determinar visibilidad basada en cobertura de nubes y precipitación
   */
  private static determinarVisibilidad(
    coberturaNubes: number,
    probabilidadPrecipitacion: number
  ): string {
    // Si hay alta probabilidad de lluvia, la visibilidad es mala
    if (probabilidadPrecipitacion > 70) return "Mala";

    // Basado en cobertura de nubes
    if (coberturaNubes < 25) return "Excelente";
    if (coberturaNubes < 50) return "Buena";
    if (coberturaNubes < 75) return "Regular";
    return "Mala";
  }

  /**
   * Determinar estado del puerto basado en condiciones
   */
  private static determinarEstadoPuerto(
    vientoVelocidad: number,
    oleaje: number
  ): EstadoPuerto {
    // Condiciones peligrosas - Puerto cerrado
    if (vientoVelocidad > 40 || oleaje > 3.0) {
      return EstadoPuerto.CERRADO;
    }

    // Condiciones adversas - Restricciones
    if (vientoVelocidad > 30 || oleaje > 2.0) {
      return EstadoPuerto.RESTRICCIONES;
    }

    // Condiciones aceptables - Puerto abierto
    return EstadoPuerto.ABIERTO;
  }

  /**
   * Construir predicción descriptiva a partir de datos SMN
   */
  private static construirPrediccion(
    dato: SMNDatosDiarios | SMNDatosHorarios
  ): string {
    const partes: string[] = [];

    // Descripción del cielo
    partes.push(dato.desciel);

    // Información de precipitación
    const probPrec = parseFloat(dato.probprec);
    const prec = parseFloat(dato.prec);

    if (probPrec > 50) {
      partes.push(
        `Probabilidad de lluvia: ${probPrec.toFixed(0)}% (${prec.toFixed(
          1
        )} L/m²)`
      );
    }

    // Información de viento
    const viento = parseFloat(dato.velvien);
    partes.push(
      `Viento: ${viento.toFixed(1)} km/h ${this.normalizarDireccion(
        dato.dirvienc
      )}`
    );

    // Información de temperatura (si está disponible)
    if ("temp" in dato) {
      const temp = parseFloat(dato.temp);
      partes.push(`Temperatura: ${temp.toFixed(1)}°C`);
    }

    // Humedad (si está disponible)
    if ("hr" in dato) {
      const humedad = parseFloat(dato.hr);
      partes.push(`Humedad: ${humedad.toFixed(0)}%`);
    }

    return partes.join(". ");
  }

  /**
   * Obtener datos más recientes para Isla de Lobos
   * Retorna un subconjunto de las primeras horas
   */
  static async obtenerDatosRecientes(
    horasLimite: number = 24
  ): Promise<SMNDatosHorarios[]> {
    const datosHorarios = await this.getPronosticoHorario();
    const datosFiltrados = this.filtrarPorIslaLobos(datosHorarios);

    // Tomar solo las primeras N horas
    return datosFiltrados.slice(0, horasLimite) as SMNDatosHorarios[];
  }
}

export default SMNService;
