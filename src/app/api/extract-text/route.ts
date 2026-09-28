import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/fileParsing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    const text = await extractTextFromFile(file);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: `No se pudo leer el archivo: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
