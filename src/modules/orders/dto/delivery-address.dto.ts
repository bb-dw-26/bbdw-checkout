import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches } from "class-validator";

const invalid = { message: "Preencha um endereço de entrega válido.", context: { code: "INVALID_ADDRESS" } };
const trim = ({ value }: { value: unknown }) => typeof value === "string" ? value.trim() : value;

export class DeliveryAddressDto {
  @Transform(({ value }: { value: unknown }) => typeof value === "string" ? value.trim().replace(/^(\d{5})-(\d{3})$/, "$1$2") : value)
  @Matches(/^\d{8}$/, invalid)
  postalCode!: string;

  @Transform(trim)
  @Matches(/\S/, invalid)
  street!: string;

  @Transform(trim)
  @Matches(/\S/, invalid)
  number!: string;

  @Transform(trim)
  @Matches(/\S/, invalid)
  city!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === "string" ? value.trim().toUpperCase() : value)
  @Matches(/^[A-Z]{2}$/, invalid)
  state!: string;

  @IsOptional()
  @Transform(trim)
  @IsString(invalid)
  neighborhood?: string;

  @IsOptional()
  @Transform(trim)
  @IsString(invalid)
  complement?: string;
}
