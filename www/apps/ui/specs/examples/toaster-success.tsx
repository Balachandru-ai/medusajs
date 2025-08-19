import { Button, toast } from "@medusajs/ui"

export default function ToasterSuccess() {
  return (
    <Button
      onClick={() =>
        toast.success("Success", {
          description: "The quick brown fox jumps over the lazy dog.",
          duration: 5000,
        })
      }
    >
      Show
    </Button>
  )
}
