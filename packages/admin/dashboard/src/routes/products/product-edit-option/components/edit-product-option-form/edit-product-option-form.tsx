// type EditProductOptionFormProps = {
//   option: HttpTypes.AdminProductOption
// }
//
// const CreateProductOptionSchema = z.object({
//   title: z.string().min(1),
//   values: z.array(z.string()).optional(),
// })

export const CreateProductOptionForm = () => {
  // const { t } = useTranslation()
  // const { handleSuccess } = useRouteModal()
  //
  // const form = useForm<z.infer<typeof CreateProductOptionSchema>>({
  //   defaultValues: {
  //     title: option.title,
  //     values: option.values.map((v: any) => v.value),
  //   },
  //   resolver: zodResolver(CreateProductOptionSchema),
  // })
  //
  // const { mutateAsync, isPending } = useUpdateProductOption(
  //   option.product_id,
  //   option.id
  // )
  //
  // const handleSubmit = form.handleSubmit(async (values) => {
  //   mutateAsync(
  //     {
  //       id: option.id,
  //       ...values,
  //     },
  //     {
  //       onSuccess: () => {
  //         handleSuccess()
  //       },
  //     }
  //   )
  // })
  //
  // return (
  //   <RouteDrawer.Form form={form}>
  //     <KeyboundForm
  //       onSubmit={handleSubmit}
  //       className="flex flex-1 flex-col overflow-hidden"
  //     >
  //       <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
  //         <Form.Field
  //           control={form.control}
  //           name="title"
  //           render={({ field }) => {
  //             return (
  //               <Form.Item>
  //                 <Form.Label>
  //                   {t("products.fields.options.optionTitle")}
  //                 </Form.Label>
  //                 <Form.Control>
  //                   <Input
  //                     {...field}
  //                     placeholder={t(
  //                       "products.fields.options.optionTitlePlaceholder"
  //                     )}
  //                   />
  //                 </Form.Control>
  //                 <Form.ErrorMessage />
  //               </Form.Item>
  //             )
  //           }}
  //         />
  //         <Form.Field
  //           control={form.control}
  //           name="values"
  //           render={({ field: { ...field } }) => {
  //             return (
  //               <Form.Item>
  //                 <Form.Label>
  //                   {t("products.fields.options.variations")}
  //                 </Form.Label>
  //                 <Form.Control>
  //                   <ChipInput
  //                     {...field}
  //                     placeholder={t(
  //                       "products.fields.options.variantionsPlaceholder"
  //                     )}
  //                   />
  //                 </Form.Control>
  //                 <Form.ErrorMessage />
  //               </Form.Item>
  //             )
  //           }}
  //         />
  //       </RouteDrawer.Body>
  //       <RouteDrawer.Footer>
  //         <div className="flex items-center justify-end gap-x-2">
  //           <RouteDrawer.Close asChild>
  //             <Button variant="secondary" size="small">
  //               {t("actions.cancel")}
  //             </Button>
  //           </RouteDrawer.Close>
  //           <Button type="submit" size="small" isLoading={isPending}>
  //             {t("actions.save")}
  //           </Button>
  //         </div>
  //       </RouteDrawer.Footer>
  //     </KeyboundForm>
  //   </RouteDrawer.Form>
  // )
}
