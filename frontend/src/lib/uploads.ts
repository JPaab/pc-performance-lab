import { buildApiUrl } from "@/lib/api";

export async function uploadFile(path: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(errorBody || "File upload failed");
  }

  return response.json();
}
