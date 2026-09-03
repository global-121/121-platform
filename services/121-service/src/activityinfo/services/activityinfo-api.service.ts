import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { joinURL } from 'ufo';

import { ActivityInfoFormSchemaDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-form-schema.dto';
import { ActivityInfoRecordDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-record.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

// The ActivityInfo query API names each returned column after the alias asked
// for in the query string. 121 asks for the record id under this alias, and for
// every other column under the field's immutable id.
export const ACTIVITY_INFO_RECORD_ID_ALIAS = '_id';
// Formula symbol that resolves to a record's id.
const ACTIVITY_INFO_RECORD_ID_SYMBOL = '_id';

@Injectable()
export class ActivityInfoApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async getFormSchemaOrThrow({
    formId,
    token,
    baseUrl,
  }: {
    formId: string;
    token: string;
    baseUrl: string;
  }): Promise<ActivityInfoFormSchemaDto> {
    // Use joinURL instead of new URL as the baseUrl may have a path component and new URL would ignore it
    const apiUrl = joinURL(baseUrl, 'resources/form', formId, 'schema');

    const response = await this.httpService.get<
      AxiosResponse<ActivityInfoFormSchemaDto | unknown>
    >(apiUrl, this.buildAuthorizationHeaders({ token }));

    if (this.isSuccessfulResponse<ActivityInfoFormSchemaDto>(response)) {
      const formSchema = response.data;
      if (!formSchema.id || !formSchema.elements) {
        throw new Error(
          'ActivityInfo form schema is missing id or elements',
        );
      }
      return formSchema;
    }

    this.throwActivityInfoApiError({
      response,
      formId,
      apiUrl,
      notFoundMessage:
        'ActivityInfo form not found. This form does not exist, has been deleted, or the token has no access to it',
      operationDescription: 'fetch ActivityInfo form schema',
    });
  }

  public async getRecords({
    formId,
    token,
    baseUrl,
    fieldIds,
  }: {
    formId: string;
    token: string;
    baseUrl: string;
    fieldIds: string[];
  }): Promise<ActivityInfoRecordDto[]> {
    const apiUrl = new URL(
      joinURL(baseUrl, 'resources/form', formId, 'query'),
    );

    // Each query parameter defines one output column: the parameter name is the
    // column alias, the value is the formula. Requesting every field by its
    // immutable id keeps the response stable when a field code or label is
    // renamed in ActivityInfo.
    apiUrl.searchParams.set(
      ACTIVITY_INFO_RECORD_ID_ALIAS,
      ACTIVITY_INFO_RECORD_ID_SYMBOL,
    );
    for (const fieldId of fieldIds) {
      apiUrl.searchParams.set(fieldId, fieldId);
    }

    const response = await this.httpService.get<
      AxiosResponse<ActivityInfoRecordDto[] | unknown>
    >(apiUrl.toString(), this.buildAuthorizationHeaders({ token }));

    if (this.isSuccessfulResponse<ActivityInfoRecordDto[]>(response)) {
      return response.data;
    }

    this.throwActivityInfoApiError({
      response,
      formId,
      apiUrl: apiUrl.toString(),
      notFoundMessage: 'ActivityInfo records not found',
      operationDescription: 'fetch ActivityInfo records',
    });
  }

  private buildAuthorizationHeaders({ token }: { token: string }): Headers {
    return new Headers({ Authorization: `Bearer ${token}` });
  }

  private isSuccessfulResponse<T>(
    response: AxiosResponse<T | unknown>,
  ): response is AxiosResponse<T> {
    return [
      HttpStatus.OK,
      HttpStatus.CREATED,
      HttpStatus.ACCEPTED,
      HttpStatus.NO_CONTENT,
    ].includes(response.status);
  }

  private throwActivityInfoApiError({
    response,
    formId,
    apiUrl,
    notFoundMessage,
    operationDescription,
  }: {
    response: AxiosResponse<unknown>;
    formId: string;
    apiUrl: string;
    notFoundMessage: string;
    operationDescription: string;
  }): never {
    if (
      response.status === HttpStatus.UNAUTHORIZED ||
      response.status === HttpStatus.FORBIDDEN
    ) {
      throw new HttpException(
        `Unauthorized access to ActivityInfo API for form: ${formId}, url: ${apiUrl}. Please check if the provided token is valid and has access to this form.`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (
      response.status === HttpStatus.NOT_FOUND ||
      response.status === HttpStatus.GONE
    ) {
      throw new HttpException(
        `${notFoundMessage} for form: ${formId}, url: ${apiUrl}.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const errorDetail = this.extractErrorDetail(response.data);
    throw new HttpException(
      `Failed to ${operationDescription} for form: ${formId}, url: ${apiUrl}: ${errorDetail}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private extractErrorDetail(responseData: unknown): string {
    if (!responseData || typeof responseData !== 'object') {
      return 'Unknown error';
    }

    const { message, code } = responseData as Record<string, unknown>;
    if (typeof message === 'string') {
      return message;
    }
    if (typeof code === 'string') {
      return code;
    }
    return 'Unknown error';
  }
}
