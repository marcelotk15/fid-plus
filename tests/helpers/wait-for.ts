export async function waitForAssertion(assertion: () => void, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    try {
      assertion()
      return
    } catch (error) {
      if (Date.now() >= deadline) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
}
