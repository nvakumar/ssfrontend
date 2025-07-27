catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('Failed to create post. Please try again.');
  }
}
