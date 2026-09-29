import { Controller, Post, Get, Body, Query, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  async createMessage(@Body() createDto: CreateContactMessageDto) {
    await this.contactService.create(createDto);
    return {
      success: true,
      message: 'Message sent successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/contact-messages')
  async getMessages(@Query() query: GetContactMessagesQueryDto) {
    const result = await this.contactService.findAll(query);
    return {
      success: true,
      message: 'Contact messages retrieved successfully',
      data: result.messages,
      meta: result.meta,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/contact-messages/:id')
  async getMessage(@Param('id') id: string) {
    const message = await this.contactService.findOneAndMarkRead(id);
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return {
      success: true,
      message: 'Message retrieved and marked as read',
      data: message,
      meta: null,
    };
  }
}
