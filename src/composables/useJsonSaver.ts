import { ref } from 'vue';

export function useJsonSaver() {
  const saveStatus = ref<'idle' | 'saving' | 'success' | 'error'>('idle');
  const errorMessage = ref<string | null>(null);

  /**
   * Save JSON data to the server (for development purposes).
   * @param data The JSON object to save.
   * @param fileName The name of the file to save the JSON data to.
   * @returns A promise that resolves when the save operation is complete.
   */
  async function saveJsonToDiskNow(data: Record<string, unknown>, fileName: string): Promise<void> {
    saveStatus.value = 'saving';
    errorMessage.value = null;

    try {
      const response = await fetch('/write-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, fileName }),
      });

      const result = await response.json();
      if (result.success) {
        saveStatus.value = 'success';
        console.log('JSON saved to:', result.filePath);
      } else {
        saveStatus.value = 'error';
        errorMessage.value = result.error || 'Failed to save JSON.';
        console.error('Save failed:', result.error);
      }
    } catch (err) {
      saveStatus.value = 'error';
      errorMessage.value = (err as Error).message;
      console.error('Error saving JSON:', err);
    }
  }

  const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  function debouncedSaveJsonToDisk(data: Record<string, unknown>, fileName: string): void {
    // Set a delay of 1 second, and if there is a new call to this function with same
    // fileName within that time, the previous call will be cancelled.
    const key = fileName;
    if (timeouts[key]) {
      clearTimeout(timeouts[key]);
    }
    timeouts[key] = setTimeout(() => {
      saveJsonToDiskNow(data, fileName);
    }, 1000);
  }

  async function loadJsonFromDisk(fileName: string) {
    // Try to load the JSON data from the server in path `/filename
    // If the file is not found, return null
    try {
      const response = await fetch(`${fileName}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Error loading JSON:', err);
    }
  }

  return {
    saveJsonToDisk: debouncedSaveJsonToDisk,
    loadJsonFromDisk,
    saveStatus,
    errorMessage,
  };
}
