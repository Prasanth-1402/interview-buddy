"use client"

import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form";
import { Button } from "@/Components/ui/button";
import {Form} from "@/Components/ui/form";
import Link from "next/link";
import {toast} from "sonner";
import FormField from "@/Components/FormField";
import {useRouter} from "next/navigation";

const AuthFormSchema = (type : FormType) => z.object({
    name: type == "sign-up" ? z.string().min(3).max(40) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8).max(20),
})


function AuthForm({type}:{type : FormType}) {
    const formSchema = AuthFormSchema(type);
    const router = useRouter();
    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email:"",
            password:""
        },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
        try{
            if(type === "sign-up"){
                console.log("sign up", values)
                toast.success(" Account Created Successfully.Please Sign-in")
                router.push("/sign-in");
            }else{
                console.log("sign in", values)
                toast.success("Signed In Successfully");
                router.push("/");
            }
        }
        catch(e){
            console.log(e);
            toast.error(`Something went wrong : ${e}`);
        }
    }
    const isSignIn = type === "sign-in";
    return (
        <div className='card-border lg:min-w-[566px]'>
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <img src="/logo.svg" alt="logo" className="w-12 h-12"/>
                    <h2 className="text-primary-100">Interview Buddy</h2>
                </div>
                <h3>Practise Job Interview with AI</h3>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form">
                        { !isSignIn && <FormField name="name" control={form.control} label="Name" placeholder="Your Name"/>}
                        <FormField name="email" control={form.control} label="Email" placeholder="Your Mail Id"/>
                        <FormField name="password" control={form.control} label="Password" placeholder="Enter your Password" type = "password"/>
                        <Button className="btn" type="submit">{isSignIn ? "Submit" : "Create Account"}</Button>
                    </form>
                </Form>
                <p className="text-center">{ isSignIn ? "No Account Yet ?" : "Have an Account already"}
                    <Link href = {isSignIn ? "/sign-up":"/sign-in"} className ="font-bold text-user-primary ml-1">
                        {isSignIn ? "Sign Up" : "Sign in"}
                    </Link>
                </p>
            </div>
        </div>
    )
}
export default AuthForm
