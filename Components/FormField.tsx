import React from 'react';
import {FormControl, FormDescription, FormItem, FormLabel, FormMessage} from "@/Components/ui/form";
import {Input} from "@/Components/ui/input";
import {Controller, Control, FieldValues, Path} from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'file' ;
}

const FormField = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = "text"
}: FormFieldProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({field}) => (
      <FormItem>
        <FormLabel className="label">{label}</FormLabel>
        <FormControl>
          <Input type={type} className="input" placeholder={placeholder} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default FormField;
