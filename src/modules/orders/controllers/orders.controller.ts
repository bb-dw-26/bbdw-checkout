import { Body, Controller, Headers, Inject, Post, ValidationPipe } from "@nestjs/common";
import { RequestId } from "../../../common/http/decorators/request-id.decorator";
import { validationExceptionFactory } from "../../../common/http/exceptions/validation-exception.factory";
import { CreateOrderDto } from "../dto/create-order.dto";
import { OrdersService } from "../services/orders.service";

@Controller("orders")
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body(new ValidationPipe({
      // O tsx usado em desenvolvimento não emite design:paramtypes.
      expectedType: CreateOrderDto,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      exceptionFactory: validationExceptionFactory,
    })) body: CreateOrderDto,
    @RequestId() requestId: string,
    @Headers("idempotency-key") key?: string,
    @Headers("x-client-release") clientRelease?: string,
  ) {
    return this.orders.create(body, requestId, key, clientRelease);
  }
}
