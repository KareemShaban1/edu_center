<?php


namespace App\Repository\Admin;


interface PaymentRepositoryInterface
{
    // show groups/sections
    public function showGroups();

    public function choosePaymentMonth($id);

    public function addEditPayment($section_id , $fee_id);

    public function storeUpdatePayment($request);


}
