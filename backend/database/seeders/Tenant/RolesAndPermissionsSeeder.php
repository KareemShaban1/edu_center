<?php
namespace Database\Seeders\Tenant;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            ['name' => 'view activity logs','guard_name' => 'web'],
            ['name' => 'create activity log','guard_name' => 'web'],
            ['name' => 'update activity log','guard_name' => 'web'],
            ['name' => 'delete activity log','guard_name' => 'web'],

            ['name' => 'view users','guard_name' => 'web'],
            ['name' => 'create user','guard_name' => 'web'],
            ['name' => 'update user','guard_name' => 'web'],
            ['name' => 'delete user','guard_name' => 'web'],
            
            ['name'=> 'view roles','guard_name' => 'web'],
            ['name'=> 'create role','guard_name' => 'web'],
            ['name'=> 'update role','guard_name' => 'web'],
            ['name'=> 'delete role','guard_name' => 'web'],
          
            ['name'=> 'view permissions','guard_name' => 'web'],
            ['name'=> 'create permission','guard_name' => 'web'],
            ['name'=> 'update permission','guard_name' => 'web'],
            ['name'=> 'delete permission','guard_name' => 'web'],

            ['name'=> 'view grades','guard_name' => 'web'],
            ['name'=> 'create grade','guard_name' => 'web'],
            ['name'=> 'update grade','guard_name' => 'web'],
            ['name'=> 'delete grade','guard_name' => 'web'],

            ['name'=> 'view classes','guard_name' => 'web'],
            ['name'=> 'create class','guard_name' => 'web'],
            ['name'=> 'update class','guard_name' => 'web'],
            ['name'=> 'delete class','guard_name' => 'web'],

            ['name'=> 'view sections','guard_name' => 'web'],
            ['name'=> 'create section','guard_name' => 'web'],
            ['name'=> 'update section','guard_name' => 'web'],
            ['name'=> 'delete section','guard_name' => 'web'],

            ['name'=> 'view teachers','guard_name' => 'web'],
            ['name'=> 'create teacher','guard_name' => 'web'],
            ['name'=> 'update teacher','guard_name' => 'web'],
            ['name'=> 'delete teacher','guard_name' => 'web'],

            ['name'=> 'view students','guard_name' => 'web'],
            ['name'=> 'create student','guard_name' => 'web'],
            ['name'=> 'update student','guard_name' => 'web'],
            ['name'=> 'delete student','guard_name' => 'web'],

            ['name'=> 'view parents','guard_name' => 'web'],
            ['name'=> 'create parent','guard_name' => 'web'],
            ['name'=> 'update parent','guard_name' => 'web'],
            ['name'=> 'delete parent','guard_name' => 'web'],

            ['name'=> 'view fees','guard_name' => 'web'],
            ['name'=> 'create fee','guard_name' => 'web'],
            ['name'=> 'update fee','guard_name' => 'web'],
            ['name'=> 'delete fee','guard_name' => 'web'],

            ['name'=> 'view attendance','guard_name' => 'web'],
            ['name'=> 'create attendance','guard_name' => 'web'],
            ['name'=> 'update attendance','guard_name' => 'web'],
            ['name'=> 'delete attendance','guard_name' => 'web'],

            ['name'=> 'view units','guard_name' => 'web'],
            ['name'=> 'create unit','guard_name' => 'web'],
            ['name'=> 'update unit','guard_name' => 'web'],
            ['name'=> 'delete unit','guard_name' => 'web'],

            ['name'=> 'view lessons','guard_name' => 'web'],
            ['name'=> 'create lesson','guard_name' => 'web'],
            ['name'=> 'update lesson','guard_name' => 'web'],
            ['name'=> 'delete lesson','guard_name' => 'web'],

            ['name'=> 'view questions','guard_name' => 'web'],
            ['name'=> 'create question','guard_name' => 'web'],
            ['name'=> 'update question','guard_name' => 'web'],
            ['name'=> 'delete question','guard_name' => 'web'],

            ['name'=> 'view answers','guard_name' => 'web'],
            ['name'=> 'create answer','guard_name' => 'web'],
            ['name'=> 'update answer','guard_name' => 'web'],
            ['name'=> 'delete answer','guard_name' => 'web'],

            ['name'=> 'view quiz degree','guard_name' => 'web'],
            ['name'=> 'create quiz degree','guard_name' => 'web'],
            ['name'=> 'update quiz degree','guard_name' => 'web'],
            ['name'=> 'delete quiz degree','guard_name' => 'web'],

            ['name'=> 'view exam degree','guard_name' => 'web'],
            ['name'=> 'create exam degree','guard_name' => 'web'],
            ['name'=> 'update exam degree','guard_name' => 'web'],
            ['name'=> 'delete exam degree','guard_name' => 'web'],


            ['name'=> 'view words','guard_name' => 'web'],
            ['name'=> 'create word','guard_name' => 'web'],
            ['name'=> 'update word','guard_name' => 'web'],
            ['name'=> 'delete word','guard_name' => 'web'],

            ['name'=> 'view notes','guard_name' => 'web'],
            ['name'=> 'create note','guard_name' => 'web'],
            ['name'=> 'update note','guard_name' => 'web'],
            ['name'=> 'delete note','guard_name' => 'web'],

            ['name'=> 'view payments','guard_name' => 'web'],
            ['name'=> 'create payment','guard_name' => 'web'],
            ['name'=> 'update payment','guard_name' => 'web'],
            ['name'=> 'delete payment','guard_name' => 'web'],
            

            ['name'=> 'view announcements','guard_name' => 'web'],
            ['name'=> 'create announcement','guard_name' => 'web'],
            ['name'=> 'update announcement','guard_name' => 'web'],
            ['name'=> 'delete announcement','guard_name' => 'web'],
            
            ['name'=> 'view library','guard_name' => 'web'],
            ['name'=> 'create library','guard_name' => 'web'],
            ['name'=> 'update library','guard_name' => 'web'],
            ['name'=> 'delete library','guard_name' => 'web'],
            

            ['name'=> 'view certification templates','guard_name' => 'web'],
            ['name'=> 'create certification template','guard_name' => 'web'],
            ['name'=> 'update certification template','guard_name' => 'web'],
            ['name'=> 'delete certification template','guard_name' => 'web'],

            ['name'=> 'view whatsapp templates','guard_name' => 'web'],
            ['name'=> 'create whatsapp template','guard_name' => 'web'],
            ['name'=> 'update whatsapp template','guard_name' => 'web'],
            ['name'=> 'delete whatsapp template','guard_name' => 'web'],
            
            ['name'=> 'view settings','guard_name' => 'web'],
            ['name'=> 'create setting','guard_name' => 'web'],
            ['name'=> 'update setting','guard_name' => 'web'],
            ['name'=> 'delete setting','guard_name' => 'web'],




        ];
        // Create permissions
        // Permission::insert($permissions);

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission['name']], $permission);
        }
        
        
        // Create roles and assign existing permissions
        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $userRole->syncPermissions(['create user']);

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::where('guard_name', 'web')->get());
    }
}
