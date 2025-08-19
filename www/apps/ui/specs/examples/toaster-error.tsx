import { Button, toast } from "@medusajs/ui"

export default function ToasterError() {
  return (
    <Button
      onClick={() =>
        toast.error("Error", {
          description: "The quick brown fox jumps over the lazy dog.",
          duration: 5000,
        })
      }
    >
      Show
    </Button>
  )
}
