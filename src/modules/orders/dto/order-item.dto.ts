import { IsInt, Matches, Max, Min } from "class-validator";

const quantityError = {
  message: "A quantidade deve ser um inteiro entre 1 e 99.",
  context: { code: "INVALID_QUANTITY" },
};

export class OrderItemDto {
  @Matches(/\S/, {
    message: "Produto inválido.",
    context: { code: "PRODUCT_NOT_FOUND" },
  })
  productId!: string;

  @IsInt(quantityError)
  @Min(1, quantityError)
  @Max(99, quantityError)
  quantity!: number;
}
